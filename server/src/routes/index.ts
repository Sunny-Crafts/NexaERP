import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'NexaERP API is running'
  });
});

// Authentication routes (/api/auth)
router.use('/auth', authRoutes);

// Customer CRM routes (/api/customers)
router.use('/customers', customerRoutes);

// Product Management routes (/api/products)
router.use('/products', productRoutes);

export default router;
