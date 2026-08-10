import { Request, Response } from 'express';
import { ChallanService, ChallanStockError } from '../services/challan.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { ChallanStatus } from '@prisma/client';

export const getChallans = async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query;

    const result = await ChallanService.getChallans({
      status: status as ChallanStatus | 'ALL' | undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return sendSuccess(res, 'Sales challans retrieved successfully', result, 200);
  } catch (error) {
    console.error('Get challans error:', error);
    return sendError(res, 'Failed to retrieve sales challans', undefined, 500);
  }
};

export const getChallanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await ChallanService.getChallanById(id);

    if (!challan) {
      return sendError(res, 'Sales challan not found', undefined, 404);
    }

    return sendSuccess(res, 'Sales challan retrieved successfully', { challan }, 200);
  } catch (error) {
    console.error('Get challan by ID error:', error);
    return sendError(res, 'Failed to retrieve sales challan', undefined, 500);
  }
};

export const createChallan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Authentication required', undefined, 401);
    }

    const challan = await ChallanService.createChallan(req.body, userId);
    return sendSuccess(res, 'Sales challan draft created successfully', { challan }, 201);
  } catch (error: unknown) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return sendError(res, error.message, undefined, 404);
    }
    console.error('Create challan error:', error);
    return sendError(res, 'Failed to create sales challan draft', undefined, 500);
  }
};

export const updateChallan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await ChallanService.updateChallan(id, req.body);

    if (!challan) {
      return sendError(res, 'Sales challan not found', undefined, 404);
    }

    return sendSuccess(res, 'Sales challan updated successfully', { challan }, 200);
  } catch (error: unknown) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
      return sendError(res, error.message, undefined, 400);
    }
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return sendError(res, error.message, undefined, 404);
    }
    console.error('Update challan error:', error);
    return sendError(res, 'Failed to update sales challan', undefined, 500);
  }
};

export const confirmChallan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Authentication required', undefined, 401);
    }

    const challan = await ChallanService.confirmChallan(id, userId);
    return sendSuccess(res, 'Sales challan confirmed and inventory stock updated', { challan }, 200);
  } catch (error: unknown) {
    if (error instanceof ChallanStockError) {
      return res.status(409).json({
        success: false,
        message: error.message,
        product: error.product,
        available: error.available,
        requested: error.requested
      });
    }

    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
      return sendError(res, error.message, undefined, 400);
    }

    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 404) {
      return sendError(res, error.message, undefined, 404);
    }

    console.error('Confirm challan error:', error);
    return sendError(res, 'Failed to confirm sales challan', undefined, 500);
  }
};

export const cancelChallan = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = _req.params;
    const challan = await ChallanService.cancelChallan(id);

    if (!challan) {
      return sendError(res, 'Sales challan not found', undefined, 404);
    }

    return sendSuccess(res, 'Sales challan cancelled successfully', { challan }, 200);
  } catch (error: unknown) {
    if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
      return sendError(res, error.message, undefined, 400);
    }
    console.error('Cancel challan error:', error);
    return sendError(res, 'Failed to cancel sales challan', undefined, 500);
  }
};
