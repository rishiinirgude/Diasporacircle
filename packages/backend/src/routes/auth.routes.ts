import { Router, Response, Request } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { verifyWalletSignature, walletAuthMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { StellarService } from '../services/stellar.service';

const router = Router();

const ChallengeSchema = z.object({ walletAddress: z.string() });
const VerifySchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

router.post('/challenge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = ChallengeSchema.parse(req.body);

    if (!StellarService.validatePublicKey(walletAddress)) {
      res.status(400).json({ error: 'Invalid Stellar public key' });
      return;
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.authChallenge.create({ data: { walletAddress, nonce, expiresAt } });

    res.json({ nonce });
  } catch (err) {
    console.error('Challenge error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, signature, nonce } = VerifySchema.parse(req.body);

    const challenge = await prisma.authChallenge.findUnique({ where: { nonce } });

    if (!challenge) { res.status(401).json({ error: 'Invalid nonce' }); return; }
    if (challenge.used) { res.status(401).json({ error: 'Nonce already used' }); return; }
    if (challenge.expiresAt < new Date()) { res.status(401).json({ error: 'Nonce expired' }); return; }
    if (challenge.walletAddress !== walletAddress) { res.status(401).json({ error: 'Wallet mismatch' }); return; }

    const isValid = verifyWalletSignature(walletAddress, signature, nonce);
    if (!isValid) { res.status(401).json({ error: 'Invalid signature' }); return; }

    await prisma.authChallenge.update({ where: { nonce }, data: { used: true } });

    await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    const token = jwt.sign(
      { walletAddress },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

const ProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

router.post('/profile', walletAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, country, phone, email } = ProfileSchema.parse(req.body);
    const walletAddress = req.user!.walletAddress;

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { displayName, ...(country && { country }), ...(phone && { phone }), ...(email && { email }) },
      create: { walletAddress, displayName, country, phone, email },
    });

    res.json({ ok: true, user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export const authRoutes = router;
