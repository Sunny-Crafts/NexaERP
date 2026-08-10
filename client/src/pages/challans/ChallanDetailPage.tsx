import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck, 
  PackageCheck, 
  ShieldAlert, 
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { challanService } from '../../services/challanService';
import { Challan } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canManageChallans = hasRole('ADMIN', 'SALES');

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string>('');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string>('');

  const fetchChallan = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await challanService.getChallanById(id);
      setChallan(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load sales challan details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallan();
  }, [fetchChallan]);

  const handleConfirmChallan = async () => {
    if (!id) return;
    setConfirmError('');
    setIsConfirming(true);
    try {
      await challanService.confirmChallan(id);
      setIsConfirmModalOpen(false);
      setActionSuccessMessage('Sales Challan confirmed successfully! Inventory stock has been deducted.');
      setTimeout(() => setActionSuccessMessage(''), 5000);
      fetchChallan();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string; available?: number; requested?: number; product?: { name?: string } } };
        };
        const d = axiosErr.response?.data;
        if (d?.available !== undefined && d?.requested !== undefined) {
          setConfirmError(
            `Insufficient stock for ${d.product?.name || 'product'}: ${d.available} available in warehouse, but ${d.requested} requested.`
          );
        } else {
          setConfirmError(d?.message || 'Failed to confirm sales challan');
        }
      } else if (err instanceof Error) {
        setConfirmError(err.message);
      } else {
        setConfirmError('Failed to confirm sales challan');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!id) return;
    setCancelError('');
    setIsCancelling(true);
    try {
      await challanService.cancelChallan(id);
      setIsCancelModalOpen(false);
      setActionSuccessMessage('Sales Challan draft cancelled successfully.');
      setTimeout(() => setActionSuccessMessage(''), 5000);
      fetchChallan();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCancelError(axiosErr.response?.data?.message || 'Failed to cancel sales challan');
      } else if (err instanceof Error) {
        setCancelError(err.message);
      } else {
        setCancelError('Failed to cancel sales challan');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading sales challan details...</span>
      </div>
    );
  }

  if (errorMessage || !challan) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertBanner type="error" message={errorMessage || 'Sales challan not found'} />
        <button
          onClick={() => navigate('/challans')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challans</span>
        </button>
      </div>
    );
  }

  // Calculate total estimated amount from historical snapshots
  const totalAmount = (challan.items || []).reduce(
    (acc, item) => acc + Number(item.unitPriceSnapshot) * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Bar with Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/challans')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Challans</span>
        </button>

        <div className="flex items-center gap-2.5">
          {!canManageChallans && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Read-Only View</span>
            </div>
          )}

          {canManageChallans && challan.status === 'DRAFT' && (
            <>
              <button
                onClick={() => {
                  setCancelError('');
                  setIsCancelModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel Draft
              </button>

              <button
                onClick={() => navigate(`/challans/${challan.id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Items</span>
              </button>

              <button
                onClick={() => {
                  setConfirmError('');
                  setIsConfirmModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Confirm Challan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <AlertBanner
          type="success"
          message={actionSuccessMessage}
          onClose={() => setActionSuccessMessage('')}
        />
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-950 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
                {challan.challanNumber}
              </h2>
              <StatusBadge type="challan" value={challan.status} />
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-300">
                {challan.customer?.name} ({challan.customer?.businessName || 'Individual'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Authorized Staff</span>
            <div className="flex items-center gap-1.5 text-slate-200 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{challan.user?.name || 'Sales Staff'}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Issue Date</span>
            <span className="text-slate-300 font-mono text-xs">
              {formatDate(challan.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Notice Banners */}
      {challan.status === 'CONFIRMED' && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="block text-emerald-200 font-semibold">Challan Confirmed & Dispatched</strong>
            <span>
              All product lines were deducted from active warehouse stock and recorded in the Stock Movement audit ledger.
            </span>
          </div>
        </div>
      )}

      {challan.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block text-rose-200 font-semibold">Challan Cancelled</strong>
            <span>This draft was cancelled. No inventory adjustments were performed.</span>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Customer Details & Order Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Customer Details</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Recipient Name</span>
              <span className="font-bold text-slate-100">{challan.customer?.name}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Business Entity</span>
              <span className="text-slate-300">{challan.customer?.businessName || '—'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono">{challan.customer?.mobile || '—'}</span>
            </div>

            {challan.customer?.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{challan.customer.email}</span>
              </div>
            )}

            {challan.customer?.gstNumber && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">GST Identification</span>
                <span className="font-mono text-indigo-300 font-semibold">{challan.customer.gstNumber}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Dispatch Destination
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">
                {challan.customer?.address || 'Standard Registered Address'}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Table (Spans 2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Dispatched Products (Historical Snapshots)</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              {challan.items?.length || 0} Line Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 px-3">SKU</th>
                  <th className="pb-3 px-3 text-right">Unit Price</th>
                  <th className="pb-3 px-3 text-center">Quantity</th>
                  <th className="pb-3 text-right pr-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {challan.items?.map((item) => {
                  const lineSubtotal = Number(item.unitPriceSnapshot) * item.quantity;
                  return (
                    <tr key={item.id} className="hover:bg-slate-950/40">
                      {/* Product Name Snapshot */}
                      <td className="py-3 font-semibold text-slate-200">
                        {item.productNameSnapshot}
                      </td>

                      {/* SKU Snapshot */}
                      <td className="py-3 px-3 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[11px] font-bold">
                          {item.skuSnapshot}
                        </span>
                      </td>

                      {/* Unit Price Snapshot */}
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatCurrency(item.unitPriceSnapshot)}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-100 text-sm">
                        {item.quantity}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 text-right pr-2 font-mono font-bold text-emerald-400">
                        {formatCurrency(lineSubtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Challan Summary Footers */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Units</span>
                <span className="font-mono font-bold text-slate-200 text-base">
                  {challan.totalQuantity} Units
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Valuation</span>
              <span className="font-mono font-bold text-emerald-400 text-lg">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmModalOpen}
        title="Confirm Sales Challan"
        message={`Are you sure you want to confirm ${challan.challanNumber}? Confirming will immediately reduce warehouse stock by ${challan.totalQuantity} units and generate Stock OUT ledger movements. This action cannot be reversed.`}
        confirmText="Yes, Confirm & Deduct Stock"
        cancelText="Cancel"
        variant="success"
        isLoading={isConfirming}
        error={confirmError}
        onConfirm={handleConfirmChallan}
        onClose={() => setIsConfirmModalOpen(false)}
      />

      {/* Cancel Modal */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        title="Cancel Draft Challan"
        message={`Are you sure you want to cancel draft ${challan.challanNumber}? This challan will be marked as cancelled. No inventory stock will be modified.`}
        confirmText="Yes, Cancel Draft"
        cancelText="Go Back"
        variant="danger"
        isLoading={isCancelling}
        error={cancelError}
        onConfirm={handleCancelChallan}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};

export default ChallanDetailPage;
