export * from './auth';
export * from './customer';
export * from './product';
export * from './inventory';
export * from './challan';
export * from './dashboard';

export interface HealthStatus {
  success: boolean;
  message: string;
}
