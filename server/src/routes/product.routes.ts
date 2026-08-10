import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct
} from '../controllers/product.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validate, createProductSchema, updateProductSchema } from '../validators';

const router = Router();

// All product routes require authentication
router.use(authMiddleware);

// GET /api/products — List products with search, category, stockStatus, lowStock, and pagination
router.get(
  '/', 
  requireRole(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), 
  getProducts
);

// GET /api/products/categories — List distinct product categories
router.get(
  '/categories', 
  requireRole(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), 
  getCategories
);

// GET /api/products/:id — Get product details
router.get(
  '/:id', 
  requireRole(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS), 
  getProductById
);

// POST /api/products — Create new product (ADMIN & WAREHOUSE only)
router.post(
  '/', 
  requireRole(Role.ADMIN, Role.WAREHOUSE), 
  validate(createProductSchema), 
  createProduct
);

// PUT /api/products/:id — Edit product (ADMIN & WAREHOUSE only)
router.put(
  '/:id', 
  requireRole(Role.ADMIN, Role.WAREHOUSE), 
  validate(updateProductSchema), 
  updateProduct
);

export default router;
