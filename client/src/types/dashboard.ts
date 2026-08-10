export interface DashboardCustomerStats {
  total: number;
  active: number;
  leads: number;
  inactive: number;
}

export interface DashboardProductStats {
  total: number;
  lowStock: number;
  outOfStock: number;
}

export interface DashboardInventoryStats {
  totalStockUnits: number;
}

export interface DashboardChallanStats {
  today: number;
  draft: number;
  confirmed: number;
  cancelled: number;
}

export interface DashboardStats {
  customers: DashboardCustomerStats;
  products: DashboardProductStats;
  inventory: DashboardInventoryStats;
  challans: DashboardChallanStats;
}
