import { Router } from 'express';
import { Role } from '@prisma/client';
import { 
  login, 
  getMe, 
  testAdmin, 
  testSales, 
  testWarehouse, 
  testAccounts 
} from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate, loginSchema } from '../validators/auth.validator';

const router = Router();

// Public route: Login
router.post('/login', validate(loginSchema), login);

// Protected route: Current user profile
router.get('/me', authMiddleware, getMe);

// Protected test routes for role-based authorization
router.get('/test/admin', authMiddleware, requireRole(Role.ADMIN), testAdmin);
router.get('/test/sales', authMiddleware, requireRole(Role.SALES), testSales);
router.get('/test/warehouse', authMiddleware, requireRole(Role.WAREHOUSE), testWarehouse);
router.get('/test/accounts', authMiddleware, requireRole(Role.ACCOUNTS), testAccounts);

export default router;
