import api from './api';
import {
  ApiResponse,
  Challan,
  ChallanListResponse,
  ChallanQueryParams,
  CreateChallanInput,
  UpdateChallanInput
} from '../types';

export const challanService = {
  async getChallans(params?: ChallanQueryParams): Promise<ChallanListResponse> {
    const response = await api.get<ApiResponse<ChallanListResponse>>('/challans', {
      params
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch sales challans');
    }
    return response.data.data;
  },

  async getChallanById(id: string): Promise<Challan> {
    const response = await api.get<ApiResponse<{ challan: Challan }>>(`/challans/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch sales challan details');
    }
    return response.data.data.challan;
  },

  async createChallan(data: CreateChallanInput): Promise<Challan> {
    const response = await api.post<ApiResponse<{ challan: Challan }>>('/challans', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create sales challan');
    }
    return response.data.data.challan;
  },

  async updateChallan(id: string, data: UpdateChallanInput): Promise<Challan> {
    const response = await api.put<ApiResponse<{ challan: Challan }>>(`/challans/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update sales challan');
    }
    return response.data.data.challan;
  },

  async confirmChallan(id: string): Promise<Challan> {
    const response = await api.post<ApiResponse<{ challan: Challan }>>(`/challans/${id}/confirm`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to confirm sales challan');
    }
    return response.data.data.challan;
  },

  async cancelChallan(id: string): Promise<Challan> {
    const response = await api.post<ApiResponse<{ challan: Challan }>>(`/challans/${id}/cancel`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to cancel sales challan');
    }
    return response.data.data.challan;
  }
};

export default challanService;
