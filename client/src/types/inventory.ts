import { PaginationMeta } from './customer';
import { Product } from './product';
import { UserRole } from './auth';

export type MovementType = 'IN' | 'OUT';

export interface StockMovementUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: MovementType;
  reason: string | null;
  createdAt: string;
  product?: Partial<Product>;
  createdBy?: StockMovementUser;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface CreateMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

export interface MovementQueryParams {
  productId?: string;
  type?: MovementType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MovementListResponse {
  movements: StockMovement[];
  pagination: PaginationMeta;
}
