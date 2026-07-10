import { Router, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { verifyWalletSignature } from '../middleware/auth.middleware';
import { StellarService } from '../services/stellar.service';

const router = Router();

const ChallengeSchema = z.object({
  walletAddress: z.string(),
});

const VerifySchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

router.post('/challenge', async (req, res: Response) => {
  try {
    const { walletAddress } = ChallengeSchema.parse(req.body);

    if (!StellarService.validatePublicKey(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Stellar public key' });
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.authChallenge.create({
      data: {
        walletAddress,
        nonce,
        expiresAt,
      },
    });

    res.json({ nonce });
  } catch (err) {
    console.error('Challenge error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.post('/verify', async (req, res: Response) => {
  try {
    const { walletAddress, signature, nonce } = VerifySchema.parse(req.body);

    // Find and validate challenge
    const challenge = await prisma.authChallenge.findUnique({
      where: { nonce },
    });

    if (!challenge) {
      return res.status(401).json({ error: 'Invalid nonce' });
    }

    if (challenge.used) {
      return res.status(401).json({ error: 'Nonce already used' });
    }

    if (challenge.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Nonce expired' });
    }

    if (challenge.walletAddress !== walletAddress) {
      return res.status(401).json({ error: 'Wallet mismatch' });
    }

    // Verify signature
    const isValid = verifyWalletSignature(walletAddress, signature, nonce);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Mark nonce as used
    await prisma.authChallenge.update({
      where: { nonce },
      data: { used: true },
    });

    // Create or update user
    await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    // Issue JWT
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

export const authRoutes = router;
