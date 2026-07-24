import { Router, Response } from 'express';
import { z } from 'zod';
import { walletAuthMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ContributionService } from '../services/contribution.service';

const router = Router();

const PrepareContributionSchema = z.object({
  cycleId: z.string(),
});

const SubmitContributionSchema = z.object({
  signedXdr: z.string(),
  cycleIndex: z.number().int().min(0),
});

// Prepare contribution (get unsigned XDR)
router.post('/:id/contribute/prepare', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContributionService.prepareContribution(
      req.params.id,
      req.user!.walletAddress
    );
    res.json(result);
  } catch (err) {
    console.error('Prepare contribution error:', err);
    res.status(400).json({ error: String(err) });
  }
});

// Submit signed contribution transaction
router.post('/:id/contribute/submit', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { signedXdr, cycleIndex } = SubmitContributionSchema.parse(req.body);
    const result = await ContributionService.submitContribution(
      signedXdr,
      req.params.id,
      req.user!.walletAddress,
      cycleIndex
    );
    res.json(result);
  } catch (err) {
    console.error('Submit contribution error:', err);
    res.status(400).json({ error: String(err) });
  }
});

export const contributionRoutes = router;
