import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { config } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Server error:', err);
  const isDev = config.nodeEnv === 'development';
  // Avoid leaking raw database errors or stack details to clients in production
  return sendError(
    res,
    'Internal Server Error',
    isDev ? err.message : undefined,
    500
  );
};
