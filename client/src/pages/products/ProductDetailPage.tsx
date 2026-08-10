import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Edit3, 
  Tag, 
  MapPin, 
  Boxes, 
  ShieldAlert, 
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { formatCurrency } from '../../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load product specifications');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const getStockStatusString = (current: number, min: number) => {
    if (current === 0) return 'OUT OF STOCK';
    if (current <= min) return 'LOW STOCK';
    return 'IN STOCK';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading product specifications...</span>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertBanner type="error" message={errorMessage || 'Product not found'} />
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>
    );
  }

  const stockStatusStr = getStockStatusString(product.currentStock, product.minimumStock);
  const stockPercentage = Math.min(100, Math.round((product.currentStock / (product.minimumStock * 2 || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Bar with Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          {!canManageProducts && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Read-Only Catalog Access</span>
            </div>
          )}

          {canManageProducts && (
            <button
              onClick={() => navigate(`/products/${product.id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-950"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Specifications</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-950 shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                {product.name}
              </h2>
              <StatusBadge type="productStock" value={stockStatusStr} />
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="font-mono font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                SKU: {product.sku}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>{product.category}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Unit Price</span>
            <span className="font-mono text-emerald-400 text-xl font-bold">
              {formatCurrency(product.unitPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Catalog ID</span>
            <span className="font-mono text-slate-300 text-[11px]">{product.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Specs and Location */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Specifications */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Specification & Catalog Metadata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Product Name</span>
                <span className="font-semibold text-slate-200 text-sm">{product.name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">SKU Code</span>
                <span className="font-mono font-bold text-slate-100 text-sm">{product.sku}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Category</span>
                <span className="font-semibold text-slate-200 text-sm">{product.category}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  <span>Warehouse Storage Bay</span>
                </span>
                <span className="font-semibold text-slate-200 text-sm">
                  {product.warehouseLocation || 'Unassigned Bay'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory & Stock Meter */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Boxes className="w-4 h-4" />
                <span>Warehouse Balances</span>
              </div>
            </div>

            {/* Big Stock Indicator */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center space-y-3">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                Current Available Quantity
              </span>
              <div className="text-4xl font-bold font-mono tracking-tight text-slate-100">
                {product.currentStock}{' '}
                <span className="text-xs text-slate-500 font-sans font-normal">Units</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Stock Buffer Gauge</span>
                  <span>{stockPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      product.currentStock === 0
                        ? 'bg-rose-500 w-0'
                        : product.currentStock <= product.minimumStock
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, stockPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Threshold Specs */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">Minimum Stock Threshold</span>
                <span className="font-mono font-bold text-slate-200">{product.minimumStock} Units</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <span className="text-slate-400">Reorder Status</span>
                {product.currentStock <= product.minimumStock ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1 text-xs">
                    <TrendingDown className="w-3.5 h-3.5" /> Low Stock
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Optimal Stock
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
