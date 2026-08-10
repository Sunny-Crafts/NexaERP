import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan
} from '../controllers/challan.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate, createChallanSchema, updateChallanSchema } from '../validators';

const router = Router();

// All challan routes require authentication
router.use(authMiddleware);

// GET /api/challans — List challans with search, status filter, and pagination
router.get(
  '/',
  requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS),
  getChallans
);

// GET /api/challans/:id — Get challan detail with product snapshots
router.get(
  '/:id',
  requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS),
  getChallanById
);

// POST /api/challans — Create new draft challan (ADMIN & SALES only)
router.post(
  '/',
  requireRole(Role.ADMIN, Role.SALES),
  validate(createChallanSchema),
  createChallan
);

// PUT /api/challans/:id — Edit draft challan (ADMIN & SALES only)
router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.SALES),
  validate(updateChallanSchema),
  updateChallan
);

// POST /api/challans/:id/confirm — Atomic confirmation & stock deduction (ADMIN & SALES only)
router.post(
  '/:id/confirm',
  requireRole(Role.ADMIN, Role.SALES),
  confirmChallan
);

// POST /api/challans/:id/cancel — Cancel draft challan (ADMIN & SALES only)
router.post(
  '/:id/cancel',
  requireRole(Role.ADMIN, Role.SALES),
  cancelChallan
);

export default router;
