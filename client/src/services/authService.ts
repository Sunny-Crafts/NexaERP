import api from './api';
import { ApiResponse, AuthResponse, LoginCredentials, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch user profile');
    }
    return response.data.data.user;
  },

  logout(): void {
    localStorage.removeItem('nexa_token');
    localStorage.removeItem('nexa_user');
  },

  async testRoleAccess(roleName: 'admin' | 'sales' | 'warehouse' | 'accounts'): Promise<{
    status: number;
    data: ApiResponse;
  }> {
    try {
      const response = await api.get<ApiResponse>(`/auth/test/${roleName}`);
      return {
        status: response.status,
        data: response.data
      };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosErr = error as { response: { status: number; data: ApiResponse } };
        return {
          status: axiosErr.response.status,
          data: axiosErr.response.data
        };
      }
      return {
        status: 500,
        data: {
          success: false,
          message: 'Network or unexpected error'
        }
      };
    }
  }
};

export default authService;
