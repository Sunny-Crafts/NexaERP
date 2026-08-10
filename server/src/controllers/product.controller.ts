import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, lowStock, stockStatus, page, limit } = req.query;

    const result = await ProductService.getProducts({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      lowStock: lowStock === 'true',
      stockStatus: stockStatus as 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return sendSuccess(res, 'Products retrieved successfully', result, 200);
  } catch (error) {
    console.error('Get products error:', error);
    return sendError(res, 'Failed to retrieve products', undefined, 500);
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await ProductService.getCategories();
    return sendSuccess(res, 'Categories retrieved successfully', { categories }, 200);
  } catch (error) {
    console.error('Get categories error:', error);
    return sendError(res, 'Failed to retrieve categories', undefined, 500);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductService.getProductById(id);

    if (!product) {
      return sendError(res, 'Product not found', undefined, 404);
    }

    return sendSuccess(res, 'Product retrieved successfully', { product }, 200);
  } catch (error) {
    console.error('Get product by ID error:', error);
    return sendError(res, 'Failed to retrieve product', undefined, 500);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await ProductService.createProduct(req.body);
    return sendSuccess(res, 'Product created successfully', { product }, 201);
  } catch (error: unknown) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 409) {
      return sendError(res, error.message, undefined, 409);
    }
    console.error('Create product error:', error);
    return sendError(res, 'Failed to create product', undefined, 500);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductService.updateProduct(id, req.body);

    if (!product) {
      return sendError(res, 'Product not found', undefined, 404);
    }

    return sendSuccess(res, 'Product updated successfully', { product }, 200);
  } catch (error: unknown) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 409) {
      return sendError(res, error.message, undefined, 409);
    }
    console.error('Update product error:', error);
    return sendError(res, 'Failed to update product', undefined, 500);
  }
};
