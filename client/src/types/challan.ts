import { PaginationMeta } from './customer';
import { Customer } from './customer';
import { StockMovementUser } from './inventory';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number | string;
  quantity: number;
  createdAt: string;
  product?: {
    id: string;
    currentStock: number;
    warehouseLocation: string | null;
  };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  user?: StockMovementUser;
  items?: ChallanItem[];
  itemCount?: number;
}

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export interface CreateChallanInput {
  customerId: string;
  items: ChallanItemInput[];
}

export interface UpdateChallanInput {
  customerId?: string;
  items?: ChallanItemInput[];
}

export interface ChallanQueryParams {
  status?: ChallanStatus | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChallanListResponse {
  challans: Challan[];
  pagination: PaginationMeta;
}
