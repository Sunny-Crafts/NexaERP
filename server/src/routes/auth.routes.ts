import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, loginSchema } from '../validators/auth.validator';

const router = Router();

// Public route: Login
router.post('/login', validate(loginSchema), login);

// Protected route: Current user profile
router.get('/me', authMiddleware, getMe);

export default router;
