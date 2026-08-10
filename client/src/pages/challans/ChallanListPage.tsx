import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { challanService } from '../../services/challanService';
import { Challan, ChallanStatus, PaginationMeta } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { formatDate } from '../../utils/formatters';

export const ChallanListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ChallanStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canManageChallans = hasRole('ADMIN', 'SALES');

  // Debounce search by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchChallans = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await challanService.getChallans({
        search: debouncedSearch,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      setChallans(data.challans);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load sales challans');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with Stats & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Sales Challans</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create customer dispatch orders, draft product allocations, and execute atomic inventory reductions.
          </p>
        </div>

        {canManageChallans && (
          <button
            onClick={() => navigate('/challans/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Challan</span>
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
            placeholder="Search by challan number (e.g. SC-00001) or customer name..."
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {(['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Challans' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onRetry={fetchChallans}
        />
      )}

      {/* Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Challan Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Total Quantity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 bg-slate-800 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-800/60 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-32 mb-1" />
                      <div className="h-3 bg-slate-800/60 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-14" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-slate-800 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-20" />
                    </td>
                    <td className="py-4 px-4 text-right pr-6">
                      <div className="h-7 bg-slate-800 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : challans.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No sales challans found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No challans match your active search and filter criteria.'
                        : 'No sales dispatch challans have been created yet.'}
                    </p>
                    {canManageChallans && (
                      <button
                        onClick={() => navigate('/challans/new')}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create First Challan</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/challans/${challan.id}`)}
                  >
                    {/* Challan Number */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 font-bold group-hover:underline">
                        {challan.challanNumber}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 text-sm">
                        {challan.customer?.name || 'Customer Account'}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{challan.customer?.businessName || '—'}</span>
                      </div>
                    </td>

                    {/* Total Quantity */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-200">
                      {challan.totalQuantity}{' '}
                      <span className="text-[11px] text-slate-500 font-sans font-normal">
                        ({challan.itemCount || (challan.items?.length || 1)} lines)
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge type="challan" value={challan.status} />
                    </td>

                    {/* Created By */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-semibold text-slate-200">
                          {challan.createdBy?.name || challan.user?.name || 'Sales Staff'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {formatDate(challan.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/challans/${challan.id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View Challan Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canManageChallans && challan.status === 'DRAFT' && (
                          <button
                            onClick={() => navigate(`/challans/${challan.id}/edit`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Draft"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{challans.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.total}</span> sales challans
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

export default ChallanListPage;
