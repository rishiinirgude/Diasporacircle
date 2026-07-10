import { Request, Response, NextFunction } from 'express';

export interface ErrorWithStatus extends Error {
  statusCode?: number;
}

export function errorMiddleware(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
