import api from './api';
import { 
  ApiResponse, 
  Customer, 
  CustomerDetailResponse, 
  CustomerListResponse, 
  CreateCustomerInput, 
  UpdateCustomerInput, 
  CreateFollowUpInput,
  CustomerFollowUp
} from '../types';

export const customerService = {
  async getCustomers(params?: { search?: string; page?: number; limit?: number }): Promise<CustomerListResponse> {
    const response = await api.get<ApiResponse<CustomerListResponse>>('/customers', {
      params
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch customers');
    }

    return response.data.data;
  },

  async getCustomerById(id: string): Promise<CustomerDetailResponse> {
    const response = await api.get<ApiResponse<CustomerDetailResponse>>(`/customers/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch customer details');
    }

    return response.data.data;
  },

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    const response = await api.post<ApiResponse<{ customer: Customer }>>('/customers', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create customer');
    }

    return response.data.data.customer;
  },

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const response = await api.put<ApiResponse<{ customer: Customer }>>(`/customers/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update customer');
    }

    return response.data.data.customer;
  },

  async addFollowUp(customerId: string, data: CreateFollowUpInput): Promise<CustomerFollowUp> {
    const response = await api.post<ApiResponse<{ followUp: CustomerFollowUp }>>(
      `/customers/${customerId}/followups`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to record follow-up');
    }

    return response.data.data.followUp;
  }
};

export default customerService;
