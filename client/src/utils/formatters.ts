/**
 * Standard formatting utilities for NexaERP UI consistency
 */

/**
 * Formats a number or string into Indian Rupee currency format (e.g. ₹500, ₹1,250.00, ₹12,500.00)
 */
export const formatCurrency = (amount: number | string | undefined | null, includeDecimals = true): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  const numericVal = Number(amount);
  return `₹${numericVal.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0
  })}`;
};

/**
 * Formats a date string into standard "10 Aug 2026"
 */
export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

/**
 * Formats a date string into standard "10 Aug 2026, 04:30 PM"
 */
export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '—';
  }
};
