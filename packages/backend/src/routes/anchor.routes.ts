import { Router, Response } from 'express';
import { z } from 'zod';
import { walletAuthMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { AnchorService } from '../services/anchor.service';

const router = Router();

const DepositUrlSchema = z.object({
  anchorDomain: z.string(),
  assetCode: z.string(),
});

// List supported anchors
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const anchors = AnchorService.getSupportedAnchors();
    res.json(anchors);
  } catch (err) {
    console.error('Get anchors error:', err);
    res.status(400).json({ error: 'Failed to fetch anchors' });
  }
});

// Get deposit URL for an anchor
router.post('/deposit-url', walletAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { anchorDomain, assetCode } = DepositUrlSchema.parse(req.body);
    const result = await AnchorService.getDepositUrl(
      anchorDomain,
      assetCode,
      req.headers.authorization || ''
    );
    res.json(result);
  } catch (err) {
    console.error('Get deposit URL error:', err);
    res.status(400).json({ error: 'Failed to get deposit URL' });
  }
});

export const anchorRoutes = router;
