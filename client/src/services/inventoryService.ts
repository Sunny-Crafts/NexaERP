import api from './api';
import {
  ApiResponse,
  InventorySummary,
  MovementListResponse,
  MovementQueryParams,
  CreateMovementInput,
  StockMovement
} from '../types';

export const inventoryService = {
  async getSummary(): Promise<InventorySummary> {
    const response = await api.get<ApiResponse<InventorySummary>>('/inventory/summary');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch inventory summary');
    }
    return response.data.data;
  },

  async getMovements(params?: MovementQueryParams): Promise<MovementListResponse> {
    const response = await api.get<ApiResponse<MovementListResponse>>('/inventory/movements', {
      params
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch stock movements');
    }
    return response.data.data;
  },

  async createMovement(
    data: CreateMovementInput
  ): Promise<{ movement: StockMovement; updatedProduct: { id: string; name: string; currentStock: number } }> {
    const response = await api.post<
      ApiResponse<{ movement: StockMovement; updatedProduct: { id: string; name: string; currentStock: number } }>
    >('/inventory/movements', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to record stock movement');
    }

    return response.data.data;
  }
};

export default inventoryService;
