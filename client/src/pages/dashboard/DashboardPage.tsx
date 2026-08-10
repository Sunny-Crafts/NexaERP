import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Boxes, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  PlusCircle, 
  UserCheck, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Building2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { DashboardStats, Challan, StockMovement, Product, ChallanStatus } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canCreateChallan = hasRole('ADMIN', 'SALES');
  const canManageInventory = hasRole('ADMIN', 'WAREHOUSE');
  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');
  const canManageCustomers = hasRole('ADMIN', 'SALES');

  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage('');

    try {
      const [statsData, challansData, movementsData, lowStockData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentChallans(6),
        dashboardService.getRecentStockMovements(6),
        dashboardService.getLowStockProducts(8)
      ]);

      setStats(statsData);
      setRecentChallans(challansData);
      setRecentMovements(movementsData);
      setLowStockProducts(lowStockData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load real-time dashboard analytics');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusBadge = (status: ChallanStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>DRAFT</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Welcome, Date, and Refresh */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {user?.name || 'Operator'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 pl-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Live operational overview</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>

          {canCreateChallan && (
            <button
              onClick={() => navigate('/challans/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ New Challan</span>
            </button>
          )}

          {canManageInventory && (
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stock Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 rounded-lg text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 cursor-pointer hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Customer Accounts</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {isLoading ? (
                <div className="h-8 bg-slate-800 rounded w-16 animate-pulse" />
              ) : (
                stats?.customers.total ?? 0
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{stats?.customers.active ?? 0} Active</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">{stats?.customers.leads ?? 0} Leads</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Products */}
        <div
          onClick={() => navigate('/products')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 cursor-pointer hover:border-teal-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Product Catalog</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {isLoading ? (
                <div className="h-8 bg-slate-800 rounded w-16 animate-pulse" />
              ) : (
                stats?.products.total ?? 0
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="text-slate-300 font-semibold">
                {(stats?.products.total ?? 0) - (stats?.products.outOfStock ?? 0)} In Stock
              </span>
              {stats?.products.outOfStock ? (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-semibold">{stats.products.outOfStock} Stockout</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Card 3: Total Stock Units & Alerts */}
        <div
          onClick={() => navigate('/inventory')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 cursor-pointer hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Warehouse Stock Units</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {isLoading ? (
                <div className="h-8 bg-slate-800 rounded w-20 animate-pulse" />
              ) : (
                stats?.inventory.totalStockUnits.toLocaleString('en-IN') ?? 0
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              {stats && stats.products.lowStock > 0 ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.products.lowStock} Low Stock Alert
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Optimal inventory buffer</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Sales Challans */}
        <div
          onClick={() => navigate('/challans')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 cursor-pointer hover:border-indigo-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Sales Challans</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {isLoading ? (
                <div className="h-8 bg-slate-800 rounded w-16 animate-pulse" />
              ) : (
                stats?.challans.today ?? 0
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{stats?.challans.confirmed ?? 0} Confirmed</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-300 font-semibold">{stats?.challans.draft ?? 0} Draft</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Recent Challans & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Recent Sales Challans */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Recent Sales Challans</span>
            </div>
            <button
              onClick={() => navigate('/challans')}
              className="text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-950/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentChallans.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-medium text-slate-400">No recent sales challans</p>
              {canCreateChallan && (
                <button
                  onClick={() => navigate('/challans/new')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  + Create First Challan
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">Challan</th>
                    <th className="pb-2.5 px-2">Customer</th>
                    <th className="pb-2.5 px-2 text-center">Qty</th>
                    <th className="pb-2.5 px-2">Status</th>
                    <th className="pb-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentChallans.map((ch) => (
                    <tr
                      key={ch.id}
                      onClick={() => navigate(`/challans/${ch.id}`)}
                      className="hover:bg-slate-950/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 font-mono font-bold text-emerald-400 group-hover:underline">
                        {ch.challanNumber}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-200 truncate max-w-[130px]">
                        {ch.customer?.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-300">
                        {ch.totalQuantity}
                      </td>
                      <td className="py-2.5 px-2">{getStatusBadge(ch.status)}</td>
                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-400">
                        {new Date(ch.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Card: Low Stock Urgent Products */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Low-Stock Threshold Alerts</span>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="text-slate-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-950/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
              <p className="font-semibold text-slate-300">All products are sufficiently stocked</p>
              <p className="text-[11px] text-slate-500">No warehouse items have breached minimum stock limits.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">Product & SKU</th>
                    <th className="pb-2.5 px-2">Stock Level</th>
                    <th className="pb-2.5 px-2">Bay</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {lowStockProducts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="hover:bg-slate-950/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5">
                        <div className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate max-w-[150px]">
                          {p.name}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{p.sku}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">
                        <span className="font-bold text-rose-400">{p.currentStock}</span>
                        <span className="text-[10px] text-slate-500"> / min {p.minimumStock}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px] truncate max-w-[90px]">
                        {p.warehouseLocation || '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.currentStock === 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {p.currentStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Section: Recent Stock Movements Ledger */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Recent Inventory Audit Movements</span>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-slate-400 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-950/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentMovements.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400">No stock movements yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-2.5">Product & SKU</th>
                  <th className="pb-2.5 px-3">Type</th>
                  <th className="pb-2.5 px-3">Quantity</th>
                  <th className="pb-2.5 px-3">Reason / Purpose</th>
                  <th className="pb-2.5 px-3">Authorized By</th>
                  <th className="pb-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentMovements.map((m) => {
                  const isIn = m.type === 'IN';
                  return (
                    <tr key={m.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5">
                        <span className="font-bold text-slate-200">{m.product?.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 block">{m.product?.sku}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isIn
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                          )}
                          <span>STOCK {m.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={isIn ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500 font-sans font-normal">units</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[200px]">
                        {m.reason || 'Inventory Adjustment'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="font-medium">{m.createdBy?.name || 'Staff'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
