import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexa_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized 401 gracefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are checking login credentials
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login')) {
        localStorage.removeItem('nexa_token');
        localStorage.removeItem('nexa_user');
      }
    }
    return Promise.reject(error);
  }
);

// Health check utility
export async function checkApiHealth(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await api.get<ApiResponse>('/health');
    return {
      success: response.data.success,
      message: response.data.message || 'API is online'
    };
  } catch (err: unknown) {
    let message = 'Failed to connect to API';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message || err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return {
      success: false,
      message
    };
  }
}

export default api;
