import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { authRoutes } from './routes/auth.routes';
import { circleRoutes } from './routes/circle.routes';
import { contributionRoutes } from './routes/contribution.routes';
import { reputationRoutes } from './routes/reputation.routes';
import { anchorRoutes } from './routes/anchor.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(pinoHttp());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/circles', contributionRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/anchors', anchorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', analyticsRoutes); // alias for feedback endpoint

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origin: ${process.env.FRONTEND_URL || '*'}`);
});

export default app;
