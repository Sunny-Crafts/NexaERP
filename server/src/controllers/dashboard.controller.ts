import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/response';

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await DashboardService.getStats();
    return sendSuccess(res, 'Dashboard statistics retrieved successfully', stats, 200);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return sendError(res, 'Failed to retrieve dashboard statistics', undefined, 500);
  }
};

export const getRecentChallans = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const challans = await DashboardService.getRecentChallans(limit);
    return sendSuccess(res, 'Recent sales challans retrieved successfully', { challans }, 200);
  } catch (error) {
    console.error('Get recent challans error:', error);
    return sendError(res, 'Failed to retrieve recent sales challans', undefined, 500);
  }
};

export const getRecentStockMovements = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const movements = await DashboardService.getRecentStockMovements(limit);
    return sendSuccess(res, 'Recent stock movements retrieved successfully', { movements }, 200);
  } catch (error) {
    console.error('Get recent stock movements error:', error);
    return sendError(res, 'Failed to retrieve recent stock movements', undefined, 500);
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const products = await DashboardService.getLowStockProducts(limit);
    return sendSuccess(res, 'Low-stock products retrieved successfully', { products }, 200);
  } catch (error) {
    console.error('Get low-stock products error:', error);
    return sendError(res, 'Failed to retrieve low-stock products', undefined, 500);
  }
};
