import { Router, Response, Request } from 'express';
import { ReputationService } from '../services/reputation.service';

const router = Router();

// Get reputation profile for a wallet
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const profile = await ReputationService.getProfile(req.params.walletAddress);
    res.json(profile);
  } catch (err) {
    console.error('Get reputation error:', err);
    res.status(400).json({ error: 'Failed to fetch reputation' });
  }
});

export const reputationRoutes = router;
