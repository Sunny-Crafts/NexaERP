import React, { useState, useEffect, useCallback } from 'react';
import { 
  Boxes, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  AlertTriangle, 
  PackageCheck, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  X, 
  Sparkles,
  ShieldAlert,
  Layers,
  ArrowRight,
  TrendingDown,
  Warehouse
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { 
  StockMovement, 
  InventorySummary, 
  PaginationMeta, 
  Product, 
  MovementType 
} from '../../types';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageInventory = hasRole('ADMIN', 'WAREHOUSE');

  // Summary State
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });

  // Movements List State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Products List for Form & Filter
  const [productList, setProductList] = useState<Product[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Add Movement Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    productId: string;
    type: MovementType;
    quantity: number;
    reason: string;
  }>({
    productId: '',
    type: 'IN',
    quantity: 1,
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Selected product object for stock preview
  const selectedProduct = productList.find((p) => p.id === formData.productId);

  // Debounce search by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load all products for the picker
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productService.getProducts({ limit: 100 });
        setProductList(data.products);
        if (data.products.length > 0 && !formData.productId) {
          setFormData((prev) => ({ ...prev, productId: data.products[0].id }));
        }
      } catch (err) {
        console.error('Failed to load product list for inventory:', err);
      }
    };
    loadProducts();
  }, []);

  // Fetch summary and movements
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [sumData, movData] = await Promise.all([
        inventoryService.getSummary(),
        inventoryService.getMovements({
          search: debouncedSearch,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          productId: selectedProductFilter !== 'ALL' ? selectedProductFilter : undefined,
          page: pagination.page,
          limit: pagination.limit
        })
      ]);

      setSummary(sumData);
      setMovements(movData.movements);
      setPagination(movData.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load inventory data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, selectedProductFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleOpenModal = () => {
    setModalError('');
    if (productList.length > 0) {
      setFormData({
        productId: productList[0].id,
        type: 'IN',
        quantity: 10,
        reason: 'New purchase received'
      });
    }
    setIsModalOpen(true);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!formData.productId) {
      setModalError('Please select a product');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setModalError('Quantity must be greater than zero');
      return;
    }
    if (!formData.reason.trim()) {
      setModalError('Please provide a reason for this movement');
      return;
    }

    if (formData.type === 'OUT' && selectedProduct && formData.quantity > selectedProduct.currentStock) {
      setModalError(
        `Insufficient stock! Requested ${formData.quantity} units, but only ${selectedProduct.currentStock} are available in warehouse.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.createMovement({
        productId: formData.productId,
        type: formData.type,
        quantity: Number(formData.quantity),
        reason: formData.reason.trim()
      });

      setSuccessToast(`Stock ${formData.type} movement recorded successfully!`);
      setTimeout(() => setSuccessToast(''), 4000);
      setIsModalOpen(false);

      // Refresh product list and movements
      const prodData = await productService.getProducts({ limit: 100 });
      setProductList(prodData.products);
      fetchData();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string; available?: number; requested?: number } };
        };
        const resData = axiosErr.response?.data;
        if (resData?.available !== undefined && resData?.requested !== undefined) {
          setModalError(
            `Insufficient stock: ${resData.available} available, ${resData.requested} requested.`
          );
        } else {
          setModalError(resData?.message || 'Server rejected stock movement');
        }
      } else if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Failed to record stock movement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock calculation preview
  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  const isOut = formData.type === 'OUT';
  const previewQuantity = Number(formData.quantity) || 0;
  const previewNewStock = isOut ? currentStock - previewQuantity : currentStock + previewQuantity;
  const isInsufficient = isOut && previewQuantity > currentStock;

  return (
    <div className="space-y-6">
      {/* Header section with Stats & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-400" />
            <span>Inventory & Stock Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock auditing, transactional movements, and warehouse balance control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!canManageInventory && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Read-Only Stock Ledger</span>
            </div>
          )}

          {canManageInventory && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Stock Movement</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Catalog Products</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">{summary.totalProducts}</div>
          <span className="text-[10px] text-slate-500 block">Active registered SKUs</span>
        </div>

        {/* Card 2: Total Units */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Units In Stock</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {summary.totalStockUnits.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 block">Available warehouse inventory</span>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Low Stock Warnings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{summary.lowStockProducts}</div>
          <span className="text-[10px] text-slate-500 block">Below reorder alert limit</span>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Out of Stock</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{summary.outOfStockProducts}</div>
          <span className="text-[10px] text-slate-500 block">0 units available</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between shadow-xl">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, SKU, or movement reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Product Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 rounded-xl border border-slate-800 px-3 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedProductFilter}
              onChange={(e) => {
                setSelectedProductFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL" className="bg-slate-900">All Products</option>
              {productList.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-slate-900">
                  {prod.name} ({prod.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {(['ALL', 'IN', 'OUT'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  typeFilter === type
                    ? type === 'IN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : type === 'OUT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Movements' : `Stock ${type}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 rounded-lg text-rose-200 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Movement Ledger Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Product & SKU</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Reason / Purpose</th>
                <th className="py-3.5 px-4">Authorized By</th>
                <th className="py-3.5 px-4 text-right pr-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-slate-800 rounded w-36 mb-1.5" />
                      <div className="h-3 bg-slate-800/60 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-slate-800 rounded-full w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-12" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-44" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4 text-right pr-6">
                      <div className="h-4 bg-slate-800 rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No stock movements recorded</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchTerm || typeFilter !== 'ALL' || selectedProductFilter !== 'ALL'
                        ? 'No movements match your active filters.'
                        : 'No stock in/out transactions have been recorded yet.'}
                    </p>
                    {canManageInventory && (
                      <button
                        onClick={handleOpenModal}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Record First Movement</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isIn = m.type === 'IN';
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product & SKU */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-100 text-sm">
                          {m.product?.name || 'Product Details'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 font-bold">
                            {m.product?.sku}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{m.product?.category}</span>
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
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

                      {/* Quantity */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={isIn ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500 font-sans font-normal">units</span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {m.reason || 'General inventory adjustment'}
                      </td>

                      {/* Authorized User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{m.createdBy?.name || 'Staff'}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {m.createdBy?.role}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-right pr-6 text-slate-400 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{movements.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.total}</span> stock movements
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    pagination.page === p
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-300 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Stock Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Boxes className="w-4 h-4" />
                <span>Record Stock Movement</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMovement} className="space-y-4 text-xs">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Select Product <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, productId: e.target.value }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {productList.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (SKU: {prod.sku}) — {prod.currentStock} Units in Stock
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Movement Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'IN' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.type === 'IN'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                    <span>STOCK IN (Add)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'OUT' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.type === 'OUT'
                        ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-md shadow-rose-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>STOCK OUT (Deduct)</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Quantity <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                    }))
                  }
                  required
                  placeholder="10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Real-time Stock Preview Gauge */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Stock Preview Calculation</span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Location: {selectedProduct?.warehouseLocation || 'Bay A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-sans block font-normal">Current</span>
                    <span className="text-slate-200">{currentStock}</span>
                  </div>

                  <span className="text-slate-600">
                    {isOut ? (
                      <TrendingDown className="w-4 h-4 text-rose-400 inline" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400 inline" />
                    )}
                  </span>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-sans block font-normal">Change</span>
                    <span className={isOut ? 'text-rose-400' : 'text-emerald-400'}>
                      {isOut ? `-${previewQuantity}` : `+${previewQuantity}`}
                    </span>
                  </div>

                  <span className="text-slate-600">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 inline" />
                  </span>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-sans block font-normal">New Stock</span>
                    <span className={isInsufficient ? 'text-rose-400' : 'text-emerald-400'}>
                      {previewNewStock} Units
                    </span>
                  </div>
                </div>

                {isInsufficient && (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Requested OUT exceeds available warehouse quantity ({currentStock})!</span>
                  </div>
                )}
              </div>

              {/* Reason & Suggestion Chips */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Movement Reason / Purpose <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="e.g. New purchase shipment, Damaged in transit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />

                {/* Quick chip buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(formData.type === 'IN'
                    ? ['New purchase received', 'Opening stock', 'Customer return', 'Warehouse transfer']
                    : ['Damaged goods write-off', 'Internal usage', 'Expired / Scrap', 'Inventory audit adjustment']
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, reason: chip }))}
                      className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isInsufficient}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Record Stock Movement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
