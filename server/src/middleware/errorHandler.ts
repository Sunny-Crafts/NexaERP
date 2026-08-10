import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Server error:', err);
  return sendError(res, 'Internal Server Error', err.message, 500);
};
