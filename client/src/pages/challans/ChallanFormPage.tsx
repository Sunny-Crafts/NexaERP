import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Package, 
  Sparkles,
  AlertTriangle,
  Layers,
  Boxes
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { challanService } from '../../services/challanService';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Customer, Product, ChallanItemInput } from '../../types';

interface LineItemRow extends ChallanItemInput {
  tempId: string;
}

export const ChallanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canManageChallans = hasRole('ADMIN', 'SALES');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Role gate
  useEffect(() => {
    if (!canManageChallans) {
      navigate('/challans', { replace: true });
    }
  }, [canManageChallans, navigate]);

  // Load Customers, Products, and Existing Challan if editing
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 })
        ]);

        setCustomers(custRes.customers);
        setProducts(prodRes.products);

        if (isEditMode && id) {
          const challan = await challanService.getChallanById(id);
          if (challan.status !== 'DRAFT') {
            setStatusBanner({
              type: 'error',
              message: 'Only draft challans can be edited. This challan has already been finalized.'
            });
            setTimeout(() => navigate(`/challans/${id}`), 2000);
            return;
          }

          setSelectedCustomerId(challan.customerId);
          if (challan.items && challan.items.length > 0) {
            setLineItems(
              challan.items.map((item, idx) => ({
                tempId: `item-${idx}-${item.id}`,
                productId: item.productId,
                quantity: item.quantity
              }))
            );
          }
        } else {
          // Initialize with first customer and one empty line item if available
          if (custRes.customers.length > 0) {
            setSelectedCustomerId(custRes.customers[0].id);
          }
          if (prodRes.products.length > 0) {
            setLineItems([
              {
                tempId: `item-init-${Date.now()}`,
                productId: prodRes.products[0].id,
                quantity: 1
              }
            ]);
          }
        }
      } catch (err: unknown) {
        setStatusBanner({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to initialize sales challan data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [isEditMode, id, navigate]);

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    setLineItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${Math.random()}`,
        productId: products[0].id,
        quantity: 1
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      setStatusBanner({
        type: 'error',
        message: 'A sales challan must have at least one product item.'
      });
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, newProductId: string) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], productId: newProductId };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: Math.max(1, newQty) };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);

    if (!selectedCustomerId) {
      setStatusBanner({ type: 'error', message: 'Please select a customer' });
      return;
    }

    if (lineItems.length === 0) {
      setStatusBanner({ type: 'error', message: 'At least one product item is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      if (isEditMode && id) {
        await challanService.updateChallan(id, payload);
        setStatusBanner({
          type: 'success',
          message: 'Sales challan draft updated successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/challans/${id}`), 800);
      } else {
        const created = await challanService.createChallan(payload);
        setStatusBanner({
          type: 'success',
          message: 'Sales challan draft created successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/challans/${created.id}`), 800);
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setStatusBanner({
          type: 'error',
          message: axiosErr.response?.data?.message || 'Server rejected sales challan'
        });
      } else if (err instanceof Error) {
        setStatusBanner({ type: 'error', message: err.message });
      } else {
        setStatusBanner({ type: 'error', message: 'Failed to submit sales challan' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  let totalUnits = 0;
  let estimatedTotalValue = 0;

  lineItems.forEach((item) => {
    const prod = products.find((p) => p.id === item.productId);
    totalUnits += Number(item.quantity) || 0;
    if (prod) {
      estimatedTotalValue += Number(prod.unitPrice) * (Number(item.quantity) || 0);
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading sales challan form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(isEditMode && id ? `/challans/${id}` : '/challans')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isEditMode ? 'Challan Details' : 'Challan List'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isEditMode ? 'Editing Draft Challan' : 'New Sales Draft'}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-emerald-400" />
          <span>{isEditMode ? 'Edit Sales Challan Draft' : 'Create Sales Challan Draft'}</span>
        </h2>
        <p className="text-xs text-slate-400">
          Drafting a challan captures product snapshots without modifying warehouse balances. Stock reduction occurs during final confirmation.
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Select Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Select Customer Account</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Customer / Enterprise <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.businessName || 'Individual'} ({c.customerType})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-1 text-slate-400">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Billing Details</span>
                <p className="font-semibold text-slate-200">{selectedCustomer.businessName || selectedCustomer.name}</p>
                <p className="truncate text-[11px]">{selectedCustomer.address || 'Address on file'}</p>
                {selectedCustomer.gstNumber && (
                  <span className="font-mono text-[10px] text-emerald-400">GST: {selectedCustomer.gstNumber}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Items Table Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <Package className="w-4 h-4" />
              <span>Challan Product Line Items</span>
            </div>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Product Line</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 w-1/2">Product Specification</th>
                  <th className="pb-3 px-3">Available Stock</th>
                  <th className="pb-3 px-3">Unit Price</th>
                  <th className="pb-3 px-3">Quantity</th>
                  <th className="pb-3 px-3">Subtotal</th>
                  <th className="pb-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lineItems.map((item, index) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const isStockShortage = prod ? item.quantity > prod.currentStock : false;
                  const lineSubtotal = prod ? Number(prod.unitPrice) * item.quantity : 0;

                  return (
                    <tr key={item.tempId} className="hover:bg-slate-950/40">
                      {/* Product Picker */}
                      <td className="py-3 pr-4">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — ₹{Number(p.unitPrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3 px-3 font-mono">
                        {prod ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              prod.currentStock === 0
                                ? 'text-rose-400'
                                : prod.currentStock <= prod.minimumStock
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {prod.currentStock} units
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {prod ? `₹${Number(prod.unitPrice).toFixed(2)}` : '—'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3">
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 text-center focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        {isStockShortage && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Exceeds stock
                          </span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-100">
                        ₹{lineSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Remove Button */}
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Card & Submit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-cyan-400" />
              <span>Inventory Reservation Notice</span>
            </span>
            <p className="leading-relaxed text-[11px]">
              Saving this form creates a <strong className="text-slate-200">DRAFT Challan</strong>. Stock quantities remain untouched until a Sales or Admin user performs the final confirmation step.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>Total Product Lines</span>
              <span className="font-mono font-bold text-slate-200">{lineItems.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>Total Units Dispatched</span>
              <span className="font-mono font-bold text-slate-200">{totalUnits} Units</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="font-bold text-slate-200">Estimated Total</span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                ₹{estimatedTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(isEditMode && id ? `/challans/${id}` : '/challans')}
                className="w-1/2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'Update Draft' : 'Save Draft'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChallanFormPage;
