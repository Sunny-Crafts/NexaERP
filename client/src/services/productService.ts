import api from './api';
import { 
  ApiResponse, 
  Product, 
  ProductListResponse, 
  ProductQueryParams, 
  CreateProductInput, 
  UpdateProductInput 
} from '../types';

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
    const response = await api.get<ApiResponse<ProductListResponse>>('/products', {
      params
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch products');
    }

    return response.data.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<{ categories: string[] }>>('/products/categories');
    if (!response.data.success || !response.data.data) {
      return [];
    }
    return response.data.data.categories;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch product details');
    }

    return response.data.data.product;
  },

  async createProduct(data: CreateProductInput): Promise<Product> {
    const response = await api.post<ApiResponse<{ product: Product }>>('/products', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create product');
    }

    return response.data.data.product;
  },

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const response = await api.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update product');
    }

    return response.data.data.product;
  }
};

export default productService;
