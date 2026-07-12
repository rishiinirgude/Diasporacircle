import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// In-memory store for MVP (replace with DB in production)
const analyticsEvents: unknown[] = [];
const feedbackEntries: unknown[] = [];

const EventSchema = z.object({
  event: z.string(),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.number().optional(),
});

const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  usedFeatures: z.array(z.string()).optional(),
  easiest: z.string().optional(),
  hardest: z.string().optional(),
  wouldUse: z.string().optional(),
  wouldRecommend: z.string().optional(),
  comments: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

// Track analytics event
router.post('/track', (req: Request, res: Response) => {
  try {
    const event = EventSchema.parse(req.body);
    analyticsEvents.push({
      ...event,
      receivedAt: new Date().toISOString(),
      ip: req.ip,
    });
    console.log('[Analytics] Event tracked:', event.event);
    res.json({ ok: true });
  } catch {
    // Silently ignore malformed events
    res.json({ ok: true });
  }
});

// Get analytics summary (for monitoring)
router.get('/summary', (_req: Request, res: Response) => {
  const eventCounts: Record<string, number> = {};
  for (const e of analyticsEvents as { event: string }[]) {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  }
  res.json({
    totalEvents: analyticsEvents.length,
    totalFeedback: feedbackEntries.length,
    eventCounts,
    feedbackCount: feedbackEntries.length,
  });
});

// Submit user feedback
router.post('/feedback', (req: Request, res: Response) => {
  try {
    const feedback = FeedbackSchema.parse(req.body);
    feedbackEntries.push({
      ...feedback,
      submittedAt: new Date().toISOString(),
    });
    console.log('[Feedback] New submission, rating:', feedback.rating);
    res.json({ ok: true, message: 'Feedback received. Thank you!' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid feedback data' });
  }
});

// Get all feedback (for review)
router.get('/feedback', (_req: Request, res: Response) => {
  res.json({
    count: feedbackEntries.length,
    entries: feedbackEntries,
  });
});

export const analyticsRoutes = router;
