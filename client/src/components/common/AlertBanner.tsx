import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  onClose,
  onRetry,
  className = ''
}) => {
  if (!message) return null;

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          wrapper: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        };
      case 'error':
        return {
          wrapper: 'bg-rose-950/40 border-rose-800/60 text-rose-300',
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        };
      case 'warning':
        return {
          wrapper: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300',
          icon: <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`p-4 rounded-xl text-xs flex items-start justify-between gap-3 border shadow-md transition-all ${style.wrapper} ${className}`}>
      <div className="flex items-start gap-2.5">
        {style.icon}
        <span className="font-medium leading-relaxed">{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:opacity-80 rounded text-slate-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
