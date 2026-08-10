import { Response } from 'express';
import { InventoryService, InsufficientStockError } from '../services/inventory.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { StockMovementType } from '@prisma/client';

export const getInventorySummary = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await InventoryService.getSummary();
    return sendSuccess(res, 'Inventory summary retrieved successfully', summary, 200);
  } catch (error) {
    console.error('Get inventory summary error:', error);
    return sendError(res, 'Failed to retrieve inventory summary', undefined, 500);
  }
};

export const getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, type, search, page, limit } = req.query;

    const result = await InventoryService.getMovements({
      productId: typeof productId === 'string' ? productId : undefined,
      type: type ? (type as StockMovementType) : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return sendSuccess(res, 'Stock movements retrieved successfully', result, 200);
  } catch (error) {
    console.error('Get stock movements error:', error);
    return sendError(res, 'Failed to retrieve stock movements', undefined, 500);
  }
};

export const createStockMovement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Authentication required', undefined, 401);
    }

    const result = await InventoryService.createStockMovement(req.body, userId);
    return sendSuccess(res, 'Stock movement recorded successfully', result, 201);
  } catch (error: unknown) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({
        success: false,
        message: error.message,
        available: error.available,
        requested: error.requested
      });
    }

    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return sendError(res, error.message, undefined, 404);
    }

    console.error('Create stock movement error:', error);
    return sendError(res, 'Failed to record stock movement', undefined, 500);
  }
};
