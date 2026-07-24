import { Router, Response } from 'express';
import { z } from 'zod';
import { walletAuthMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { CircleService } from '../services/circle.service';
import { prisma } from '../config/db';

const router = Router();

const CreateCircleSchema = z.object({
  name: z.string().min(1),
  contributionAmount: z.number().positive(),
  cycleLengthDays: z.number().positive().int(),
  escrowAsset: z.string(),
  memberWallets: z.array(z.string()),
  payoutOrder: z.array(z.string()),
});

// Get all circles for authenticated user
router.get('/', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const circles = await CircleService.getUserCircles(req.user!.walletAddress);
    res.json(circles);
  } catch (err) {
    console.error('Get circles error:', err);
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
});

// Preview circle by invite code (no auth required) — must come BEFORE /:id
router.get('/join/:inviteCode', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const circle = await prisma.circle.findUnique({
      where: { inviteCode: req.params.inviteCode },
      include: { members: true },
    });
    if (!circle) {
      res.status(404).json({ error: 'Circle not found' });
      return;
    }
    res.json({
      id: circle.id,
      name: circle.name,
      contributionAmount: circle.contributionAmount,
      escrowAsset: circle.escrowAsset,
      cycleLengthDays: circle.cycleLengthDays,
      membersJoined: circle.members?.length || 0,
      totalMembers: circle.totalMembers,
    });
  } catch (err) {
    console.error('Preview circle error:', err);
    res.status(404).json({ error: 'Circle not found' });
  }
});

// Get circle by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const circle = await CircleService.getCircleById(req.params.id);
    res.json(circle);
  } catch (err) {
    console.error('Get circle error:', err);
    res.status(404).json({ error: 'Circle not found' });
  }
});

// Create new circle
router.post('/', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = CreateCircleSchema.parse(req.body);
    const circle = await CircleService.createCircle({
      ...data,
      organizerAddress: req.user!.walletAddress,
    });
    res.status(201).json(circle);
  } catch (err) {
    console.error('Create circle error:', err);
    res.status(400).json({ error: 'Failed to create circle' });
  }
});

// Start circle (organizer only)
router.post('/:id/start', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const circle = await CircleService.startCircle(
      req.params.id,
      req.user!.walletAddress
    );
    res.json(circle);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to start circle';
    console.error('Start circle error:', msg);
    res.status(400).json({ error: msg });
  }
});

// Join circle via invite code
router.post('/join/:inviteCode', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const circle = await CircleService.joinCircle(
      req.params.inviteCode,
      req.user!.walletAddress
    );
    res.status(201).json(circle);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to join circle';
    console.error('Join circle error:', msg);
    res.status(400).json({ error: msg });
  }
});

export const circleRoutes = router;
