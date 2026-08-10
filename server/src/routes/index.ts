import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'NexaERP API is running'
  });
});

export default router;
