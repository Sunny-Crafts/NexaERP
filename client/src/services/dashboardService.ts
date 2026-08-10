import api from './api';
import { ApiResponse, DashboardStats, Challan, StockMovement, Product } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch dashboard statistics');
    }
    return response.data.data;
  },

  async getRecentChallans(limit = 6): Promise<Challan[]> {
    const response = await api.get<ApiResponse<{ challans: Challan[] }>>('/dashboard/recent-challans', {
      params: { limit }
    });
    if (!response.data.success || !response.data.data) {
      return [];
    }
    return response.data.data.challans;
  },

  async getRecentStockMovements(limit = 6): Promise<StockMovement[]> {
    const response = await api.get<ApiResponse<{ movements: StockMovement[] }>>('/dashboard/recent-stock-movements', {
      params: { limit }
    });
    if (!response.data.success || !response.data.data) {
      return [];
    }
    return response.data.data.movements;
  },

  async getLowStockProducts(limit = 8): Promise<Product[]> {
    const response = await api.get<ApiResponse<{ products: Product[] }>>('/dashboard/low-stock', {
      params: { limit }
    });
    if (!response.data.success || !response.data.data) {
      return [];
    }
    return response.data.data.products;
  }
};

export default dashboardService;
