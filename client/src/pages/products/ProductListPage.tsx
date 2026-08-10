import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Tag,
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';
import { Product, PaginationMeta } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { formatCurrency } from '../../utils/formatters';

export const ProductListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');

  // Debounce search by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load distinct categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await productService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await productService.getProducts({
        search: debouncedSearch,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        stockStatus: stockFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load product catalog');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, stockFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getStockStatusString = (current: number, min: number) => {
    if (current === 0) return 'OUT OF STOCK';
    if (current <= min) return 'LOW STOCK';
    return 'IN STOCK';
  };

  return (
    <div className="space-y-6">
      {/* Header section with Stats & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Product Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage SKU specifications, category pricing, and warehouse threshold alerts.
          </p>
        </div>

        {canManageProducts && (
          <button
            onClick={() => navigate('/products/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Product</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between shadow-xl">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 rounded-xl border border-slate-800 px-3 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStockFilter(status);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  stockFilter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onRetry={fetchProducts}
        />
      )}

      {/* Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Product & Category</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Stock Levels</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-slate-800 rounded w-36 mb-1.5" />
                      <div className="h-3 bg-slate-800/60 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-24 mb-1" />
                      <div className="h-2 bg-slate-800/60 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-slate-800 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-4 text-right pr-6">
                      <div className="h-7 bg-slate-800 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No products found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchTerm || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                        ? 'No products match your active search and filter criteria.'
                        : 'No products have been added to the catalog yet.'}
                    </p>
                    {canManageProducts && !searchTerm && (
                      <button
                        onClick={() => navigate('/products/new')}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add First Product</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stockStatusStr = getStockStatusString(product.currentStock, product.minimumStock);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {/* Product Name & Category */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                          <Layers className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{product.category}</span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                          {product.sku}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {formatCurrency(product.unitPrice)}
                      </td>

                      {/* Stock Levels */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 text-sm">
                            {product.currentStock}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            / min {product.minimumStock}
                          </span>
                        </div>
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-3.5 px-4">
                        {product.warehouseLocation ? (
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{product.warehouseLocation}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4">
                        <StatusBadge type="productStock" value={stockStatusStr} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="View Product Specs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canManageProducts && (
                            <button
                              onClick={() => navigate(`/products/${product.id}/edit`)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
            Showing <span className="font-semibold text-slate-200">{products.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.total}</span> products
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
                      ? 'bg-indigo-600 text-white shadow-sm'
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
    </div>
  );
};

export default ProductListPage;
