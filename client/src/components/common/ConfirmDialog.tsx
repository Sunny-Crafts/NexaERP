import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
            {confirmVariant === 'danger' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : confirmVariant === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
            )}
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
