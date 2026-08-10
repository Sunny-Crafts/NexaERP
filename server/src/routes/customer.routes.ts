import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  createFollowUp
} from '../controllers/customer.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { 
  validate, 
  createCustomerSchema, 
  updateCustomerSchema, 
  createFollowUpSchema 
} from '../validators';

const router = Router();

// All customer routes require authentication
router.use(authMiddleware);

// GET /api/customers — List with search & pagination (All authenticated roles)
router.get(
  '/', 
  requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), 
  getCustomers
);

// GET /api/customers/:id — Customer detail & follow-up history (All authenticated roles)
router.get(
  '/:id', 
  requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), 
  getCustomerById
);

// POST /api/customers — Create new customer (ADMIN & SALES only)
router.post(
  '/', 
  requireRole(Role.ADMIN, Role.SALES), 
  validate(createCustomerSchema), 
  createCustomer
);

// PUT /api/customers/:id — Update existing customer (ADMIN & SALES only)
router.put(
  '/:id', 
  requireRole(Role.ADMIN, Role.SALES), 
  validate(updateCustomerSchema), 
  updateCustomer
);

// POST /api/customers/:id/followups — Add follow-up note (ADMIN & SALES only)
router.post(
  '/:id/followups', 
  requireRole(Role.ADMIN, Role.SALES), 
  validate(createFollowUpSchema), 
  createFollowUp
);

export default router;
