import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight,
  Shield,
  User,
  Briefcase
} from 'lucide-react';
import { CustomerStatus, ChallanStatus, MovementType, Role } from '../../types';

interface StatusBadgeProps {
  type: 'customer' | 'challan' | 'productStock' | 'movement' | 'role';
  value: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className = '' }) => {
  if (type === 'customer') {
    const status = value as CustomerStatus;
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Active</span>
          </span>
        );
      case 'LEAD':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Lead</span>
          </span>
        );
      case 'INACTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Inactive</span>
          </span>
        );
      default:
        return <span className={`px-2 py-0.5 rounded text-xs text-slate-400 ${className}`}>{value}</span>;
    }
  }

  if (type === 'challan') {
    const status = value as ChallanStatus;
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 ${className}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Draft</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span className={`px-2 py-0.5 rounded text-xs text-slate-400 ${className}`}>{value}</span>;
    }
  }

  if (type === 'productStock') {
    const stockStatus = value.toUpperCase();
    if (stockStatus === 'OUT OF STOCK') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
          <XCircle className="w-3.5 h-3.5" />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (stockStatus === 'LOW STOCK') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>In Stock</span>
      </span>
    );
  }

  if (type === 'movement') {
    const mov = value as MovementType;
    if (mov === 'IN') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Stock IN</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
        <ArrowUpRight className="w-3.5 h-3.5" />
        <span>Stock OUT</span>
      </span>
    );
  }

  if (type === 'role') {
    const role = value as Role;
    switch (role) {
      case 'ADMIN':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ${className}`}>
            <Shield className="w-3 h-3" />
            <span>ADMIN</span>
          </span>
        );
      case 'SALES':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}>
            <Briefcase className="w-3 h-3" />
            <span>SALES</span>
          </span>
        );
      case 'WAREHOUSE':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${className}`}>
            <User className="w-3 h-3" />
            <span>WAREHOUSE</span>
          </span>
        );
      case 'ACCOUNTS':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}>
            <Briefcase className="w-3 h-3" />
            <span>ACCOUNTS</span>
          </span>
        );
      default:
        return <span className={`px-2 py-0.5 rounded text-xs text-slate-400 ${className}`}>{value}</span>;
    }
  }

  return <span className={className}>{value}</span>;
};

export default StatusBadge;
