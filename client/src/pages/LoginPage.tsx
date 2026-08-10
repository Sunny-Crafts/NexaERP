import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  Briefcase, 
  Package, 
  Calculator,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { AlertBanner } from '../components/common/AlertBanner';

interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  pass: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ADMIN',
    label: 'Administrator',
    email: 'admin@nexaerp.com',
    pass: 'Admin@123',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
  },
  {
    role: 'SALES',
    label: 'Sales Rep',
    email: 'sales@nexaerp.com',
    pass: 'Sales@123',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
  },
  {
    role: 'WAREHOUSE',
    label: 'Warehouse',
    email: 'warehouse@nexaerp.com',
    pass: 'Warehouse@123',
    icon: <Package className="w-3.5 h-3.5" />,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
  },
  {
    role: 'ACCOUNTS',
    label: 'Accounts',
    email: 'accounts@nexaerp.com',
    pass: 'Accounts@123',
    icon: <Calculator className="w-3.5 h-3.5" />,
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
  }
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@nexaerp.com');
  const [password, setPassword] = useState<string>('Admin@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Invalid email or password');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to server');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NexaERP Gateway</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Sign In to NexaERP
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Mini ERP & CRM Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Switcher */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Demo Role to Quick-Fill:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemoCredentials(acc)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${acc.badgeColor} ${
                    email === acc.email ? 'ring-2 ring-indigo-500/40 font-semibold shadow-sm' : ''
                  }`}
                >
                  {acc.icon}
                  <span className="truncate">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              or enter credentials
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <AlertBanner
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage('')}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@nexaerp.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          NexaERP Auth Engine • Role-Based Access Control Active
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
