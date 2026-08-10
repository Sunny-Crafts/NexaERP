import { PaginationMeta } from './customer';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    stockMovements: number;
    challanItems: number;
  };
}

export interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  category?: string;
  unitPrice?: number;
  minimumStock?: number;
  warehouseLocation?: string;
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
  stockStatus?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  pagination: PaginationMeta;
}
