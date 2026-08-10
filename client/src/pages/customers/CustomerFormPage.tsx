import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  Save, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/customerService';
import { CreateCustomerInput } from '../../types';
import { AlertBanner } from '../../components/common/AlertBanner';

export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canEdit = hasRole('ADMIN', 'SALES');

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Enforce role authorization
  useEffect(() => {
    if (!canEdit) {
      navigate('/customers', { replace: true });
    }
  }, [canEdit, navigate]);

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        const data = await customerService.getCustomerById(id);
        const c = data.customer;
        setFormData({
          name: c.name || '',
          mobile: c.mobile || '',
          email: c.email || '',
          businessName: c.businessName || '',
          gstNumber: c.gstNumber || '',
          customerType: c.customerType,
          address: c.address || '',
          status: c.status,
          followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
          notes: c.notes || ''
        });
      } catch (err: unknown) {
        setStatusBanner({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to load customer profile'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [isEditMode, id]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Customer name must be at least 2 characters';
    }

    if (!formData.businessName.trim()) {
      errs.businessName = 'Business / Enterprise name is required';
    }

    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.address.trim()) {
      errs.address = 'Street address is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        await customerService.updateCustomer(id, formData);
        setStatusBanner({
          type: 'success',
          message: 'Customer profile updated successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/customers/${id}`), 800);
      } else {
        const created = await customerService.createCustomer(formData);
        setStatusBanner({
          type: 'success',
          message: 'Customer registered successfully! Redirecting...'
        });
        setTimeout(() => navigate(`/customers/${created.id}`), 800);
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setStatusBanner({
          type: 'error',
          message: axiosErr.response?.data?.message || 'Server rejected customer submission'
        });
      } else if (err instanceof Error) {
        setStatusBanner({ type: 'error', message: err.message });
      } else {
        setStatusBanner({ type: 'error', message: 'Failed to submit customer form' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading customer details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(isEditMode && id ? `/customers/${id}` : '/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isEditMode ? 'Customer Details' : 'Customer List'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isEditMode ? 'Editing Mode' : 'New Registration'}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-indigo-400" />
          <span>{isEditMode ? 'Edit Customer Profile' : 'Register New Customer'}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {isEditMode 
            ? 'Update customer contact, classification, and CRM notes.'
            : 'Fill in the customer information below. Mandatory fields are marked with (*).'}
        </p>
      </div>

      {/* Alert Banner */}
      {statusBanner && (
        <AlertBanner
          type={statusBanner.type}
          message={statusBanner.message}
          onClose={() => setStatusBanner(null)}
        />
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Core Identification */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Customer & Enterprise Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Contact Person / Customer Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Sharma"
                className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
            </div>

            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Company / Business Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Apex Retail Enterprises Pvt Ltd"
                className={`w-full bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.businessName
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.businessName && <p className="text-[11px] text-rose-400">{errors.businessName}</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    errors.mobile
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.mobile && <p className="text-[11px] text-rose-400">{errors.mobile}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@business.com"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    errors.email
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-400">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Card 2: Classification & Compliance */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Classification & Tax Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Customer Type <span className="text-rose-400">*</span>
              </label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Status <span className="text-rose-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="LEAD">Lead (Prospective)</option>
                <option value="ACTIVE">Active (Verified Account)</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* GST Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                GST Number <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber || ''}
                onChange={handleChange}
                placeholder="27AABCU9603R1ZM"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Address & CRM Follow-up */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Address & Follow-up Details</span>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Complete Billing & Shipping Address <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Plot / Unit number, Street, Industrial Area, City, State, PIN code"
                className={`w-full bg-slate-950/80 border rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  errors.address
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.address && <p className="text-[11px] text-rose-400">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Follow-up Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Next Follow-up Date <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Internal CRM Notes <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes || ''}
                    onChange={handleChange}
                    placeholder="Preferred shipping days, credit terms, sales interaction notes..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(isEditMode && id ? `/customers/${id}` : '/customers')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Update Customer' : 'Save Customer Profile'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;
