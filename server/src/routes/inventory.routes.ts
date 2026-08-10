import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getInventorySummary,
  getStockMovements,
  createStockMovement
} from '../controllers/inventory.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate, createMovementSchema } from '../validators';

const router = Router();

// All inventory routes require authentication
router.use(authMiddleware);

// GET /api/inventory/summary — Overall stock stats (All authenticated roles)
router.get(
  '/summary',
  requireRole(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS),
  getInventorySummary
);

// GET /api/inventory/movements — Paginated stock movement ledger (All authenticated roles)
router.get(
  '/movements',
  requireRole(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS),
  getStockMovements
);

// POST /api/inventory/movements — Record Stock IN / OUT movement (ADMIN & WAREHOUSE only)
router.post(
  '/movements',
  requireRole(Role.ADMIN, Role.WAREHOUSE),
  validate(createMovementSchema),
  createStockMovement
);

export default router;
