import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getStats,
  getRecentChallans,
  getRecentStockMovements,
  getLowStockProducts
} from '../controllers/dashboard.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// All authenticated roles have read access to dashboard metrics
const allowAllRoles = requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS);

// GET /api/dashboard/stats — High-level KPI aggregations
router.get('/stats', allowAllRoles, getStats);

// GET /api/dashboard/recent-challans — Latest sales challans
router.get('/recent-challans', allowAllRoles, getRecentChallans);

// GET /api/dashboard/recent-stock-movements — Latest inventory ledger movements
router.get('/recent-stock-movements', allowAllRoles, getRecentStockMovements);

// GET /api/dashboard/low-stock — Urgent low-stock products
router.get('/low-stock', allowAllRoles, getLowStockProducts);

export default router;
