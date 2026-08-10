import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  MapPin, 
  Boxes, 
  Layers, 
  Sparkles,
  Info,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';
import { CreateProductInput } from '../../types';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');

  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 10,
    warehouseLocation: ''
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Enforce role authorization (ADMIN & WAREHOUSE only)
  useEffect(() => {
    if (!canManageProducts) {
      navigate('/products', { replace: true });
    }
  }, [canManageProducts, navigate]);

  // Load existing product and categories
  useEffect(() => {
    const initData = async () => {
      try {
        const cats = await productService.getCategories();
        setCategories(cats);

        if (isEditMode && id) {
          setIsLoading(true);
          const p = await productService.getProductById(id);
          setFormData({
            name: p.name,
            sku: p.sku,
            category: p.category,
            unitPrice: Number(p.unitPrice),
            currentStock: p.currentStock,
            minimumStock: p.minimumStock,
            warehouseLocation: p.warehouseLocation || ''
          });
        }
      } catch (err: unknown) {
        setStatusBanner({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to load product details'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [isEditMode, id]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Product name must be at least 2 characters';
    }

    if (!formData.sku.trim()) {
      errs.sku = 'SKU is required';
    } else if (formData.sku.trim().length < 2) {
      errs.sku = 'SKU must be at least 2 characters';
    }

    if (!formData.category.trim()) {
      errs.category = 'Category is required';
    }

    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) {
      errs.unitPrice = 'Unit price must be greater than 0';
    }

    if (formData.minimumStock < 0) {
      errs.minimumStock = 'Minimum stock alert threshold cannot be negative';
    }

    if (!isEditMode && formData.currentStock < 0) {
      errs.currentStock = 'Initial stock cannot be negative';
    }

    if (!formData.warehouseLocation.trim()) {
      errs.warehouseLocation = 'Warehouse rack / bin location is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);

    if (!validateForm()) {
      setStatusBanner({
        type: 'error',
        message: 'Please resolve the highlighted validation errors.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        // Exclude currentStock when editing to preserve inventory integrity
        await productService.updateProduct(id, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unitPrice: Number(formData.unitPrice),
          minimumStock: Number(formData.minimumStock),
          warehouseLocation: formData.warehouseLocation
        });
        setStatusBanner({
          type: 'success',
          message: 'Product specifications updated successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/products/${id}`), 800);
      } else {
        const created = await productService.createProduct({
          ...formData,
          unitPrice: Number(formData.unitPrice),
          currentStock: Number(formData.currentStock),
          minimumStock: Number(formData.minimumStock)
        });
        setStatusBanner({
          type: 'success',
          message: 'Product registered in catalog successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/products/${created.id}`), 800);
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 409) {
          setStatusBanner({
            type: 'error',
            message: 'Conflict: A product with this SKU already exists. Please choose a unique SKU.'
          });
          setErrors((prev) => ({ ...prev, sku: 'SKU is already in use' }));
        } else {
          setStatusBanner({
            type: 'error',
            message: axiosErr.response?.data?.message || 'Server rejected product submission'
          });
        }
      } else if (err instanceof Error) {
        setStatusBanner({ type: 'error', message: err.message });
      } else {
        setStatusBanner({ type: 'error', message: 'Failed to submit product form' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading product specifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(isEditMode && id ? `/products/${id}` : '/products')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isEditMode ? 'Product Specs' : 'Product Catalog'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isEditMode ? 'Editing Mode' : 'New Product Registration'}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Package className="w-6 h-6 text-emerald-400" />
          <span>{isEditMode ? 'Edit Product Specifications' : 'Register New Product'}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {isEditMode
            ? 'Modify product catalog attributes. Note: Stock quantity is managed strictly via Inventory Movements.'
            : 'Enter product metadata, unit pricing, SKU, and warehouse allocation.'}
        </p>
      </div>

      {/* Alert Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border animate-fadeIn ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed font-medium">{statusBanner.message}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Product Identification */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            <span>Product Identification & Classification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Wireless Ergonomic Mouse Pro"
                className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Stock Keeping Unit (SKU) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. MOU-WL-001"
                className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.sku
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.sku && <p className="text-[11px] text-rose-400">{errors.sku}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Category <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  list="category-suggestions"
                  placeholder="e.g. Peripherals, Accessories, Cables..."
                  className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    errors.category
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              {errors.category && <p className="text-[11px] text-rose-400">{errors.category}</p>}
            </div>
          </div>
        </div>

        {/* Card 2: Pricing & Warehouse Logistics */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Pricing & Warehouse Storage Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unit Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Unit Price (₹ INR) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="unitPrice"
                  value={formData.unitPrice || ''}
                  onChange={handleChange}
                  placeholder="799.00"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    errors.unitPrice
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.unitPrice && <p className="text-[11px] text-rose-400">{errors.unitPrice}</p>}
            </div>

            {/* Warehouse Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Warehouse Location / Bay <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="warehouseLocation"
                  value={formData.warehouseLocation}
                  onChange={handleChange}
                  placeholder="e.g. Rack A-01, Bin B-12"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    errors.warehouseLocation
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.warehouseLocation && (
                <p className="text-[11px] text-rose-400">{errors.warehouseLocation}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Stock Thresholds & Initial Balance */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Stock Balances & Reorder Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Minimum Stock Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Minimum Stock Alert Level <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                placeholder="10"
                className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.minimumStock
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              <p className="text-[10px] text-slate-500">
                Triggers a 'LOW STOCK' warning when available stock falls below this quantity.
              </p>
              {errors.minimumStock && <p className="text-[11px] text-rose-400">{errors.minimumStock}</p>}
            </div>

            {/* Current Stock Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block flex items-center justify-between">
                <span>Current Stock Level</span>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </label>

              {isEditMode ? (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-100 text-sm">{formData.currentStock} Units</span>
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" /> Managed via Inventory
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              )}
              <p className="text-[10px] text-slate-500">
                {isEditMode
                  ? 'Stock quantity is locked on edit to preserve ledger integrity. Updates occur through Stock In/Out movements.'
                  : 'Initial starting quantity available in the warehouse.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(isEditMode && id ? `/products/${id}` : '/products')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Update Specifications' : 'Register Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
