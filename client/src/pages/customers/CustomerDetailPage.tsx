import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  Edit3, 
  PlusCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  FileText, 
  Layers, 
  X,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/customerService';
import { Customer, CustomerFollowUp, CustomerStatus, CustomerType } from '../../types';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canEdit = hasRole('ADMIN', 'SALES');

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Follow-up modal states
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const fetchCustomerDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await customerService.getCustomerById(id);
      setCustomer(data.customer);
      setFollowUps(data.followUps);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load customer profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setModalError('');

    if (!followUpNote.trim()) {
      setModalError('Please enter a note for this follow-up');
      return;
    }
    if (!followUpDate) {
      setModalError('Please select a target follow-up date');
      return;
    }

    setIsSubmittingFollowUp(true);
    try {
      await customerService.addFollowUp(id, {
        note: followUpNote.trim(),
        followUpDate: new Date(followUpDate).toISOString()
      });

      setSuccessToast('Follow-up activity recorded successfully!');
      setTimeout(() => setSuccessToast(''), 4000);
      setIsFollowUpModalOpen(false);
      setFollowUpNote('');
      fetchCustomerDetails();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setModalError(axiosErr.response?.data?.message || 'Failed to submit follow-up');
      } else if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Failed to record follow-up');
      }
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Account
          </span>
        );
      case 'LEAD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Prospective Lead
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: CustomerType) => {
    switch (type) {
      case 'DISTRIBUTOR':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            DISTRIBUTOR
          </span>
        );
      case 'WHOLESALE':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            WHOLESALE
          </span>
        );
      case 'RETAIL':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            RETAIL
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading customer profile...</span>
      </div>
    );
  }

  if (errorMessage || !customer) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">{errorMessage || 'Customer not found'}</h3>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </button>

        <div className="flex items-center gap-3">
          {!canEdit && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Read-Only Access</span>
            </div>
          )}

          {canEdit && (
            <>
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-teal-400" />
                <span>Add Follow-up</span>
              </button>

              <button
                onClick={() => navigate(`/customers/${customer.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-950/60"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </>
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

      {/* Customer Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-950 shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                {customer.name}
              </h2>
              {getStatusBadge(customer.status)}
              {getTypeBadge(customer.customerType)}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-300">{customer.businessName}</span>
              {customer.gstNumber && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-400">GST: {customer.gstNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Customer ID</span>
            <span className="font-mono text-slate-300 text-[11px]">{customer.id}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Registered On</span>
            <span className="text-slate-300">
              {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Information Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact & Address Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Contact & Geographic Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Mobile Phone</span>
                </span>
                <span className="font-mono text-slate-200 text-sm font-semibold">{customer.mobile}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-teal-400" />
                  <span>Email Address</span>
                </span>
                <span className="text-slate-200 text-sm font-semibold truncate block">{customer.email}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
              <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>Registered Address</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{customer.address}</p>
            </div>
          </div>

          {/* CRM Notes & Schedule */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>CRM Notes & Scheduled Interaction</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-teal-400" />
                  <span>Next Scheduled Follow-Up</span>
                </span>
                <span className="text-slate-200 font-medium">
                  {customer.followUpDate ? (
                    new Date(customer.followUpDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  ) : (
                    <span className="text-slate-500">None scheduled</span>
                  )}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>Tax & Compliance</span>
                </span>
                <span className="font-mono text-slate-200">
                  {customer.gstNumber ? customer.gstNumber : 'No GST provided'}
                </span>
              </div>
            </div>

            {customer.notes && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
                <span className="text-slate-500 text-[10px] font-bold uppercase">Account Notes</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-up Timeline */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                <span>Follow-up History</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                {followUps.length} entries
              </span>
            </div>

            {followUps.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-medium text-slate-400">No follow-ups recorded yet</p>
                {canEdit && (
                  <button
                    onClick={() => setIsFollowUpModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer pt-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Record first follow-up</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {followUps.map((item) => (
                  <div key={item.id} className="relative pl-7 space-y-1.5 text-xs">
                    {/* Timeline Node */}
                    <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 -translate-x-1/2" />

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>{item.user?.name || 'Authorized Staff'}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.user?.role}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{item.note}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Target: {new Date(item.followUpDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-Up Modal */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Record Customer Follow-up</span>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddFollowUp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Next Scheduled Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  Follow-up Notes & Discussion Summary <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  required
                  placeholder="Summarize conversation, discussed products, pricing offers, or customer concerns..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFollowUp}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingFollowUp ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Save Follow-up</span>
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

export default CustomerDetailPage;
