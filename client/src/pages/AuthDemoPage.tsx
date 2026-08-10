import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  KeyRound, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Layers,
  Terminal
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Role } from '../types';

interface TestResult {
  endpoint: string;
  roleRequired: string;
  status: number;
  data: Record<string, unknown>;
  timestamp: string;
}

export const AuthDemoPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [testingRole, setTestingRole] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const runRoleTest = async (roleName: 'admin' | 'sales' | 'warehouse' | 'accounts') => {
    setTestingRole(roleName);
    const res = await authService.testRoleAccess(roleName);
    setTestResult({
      endpoint: `/api/auth/test/${roleName}`,
      roleRequired: roleName.toUpperCase(),
      status: res.status,
      data: res.data as unknown as Record<string, unknown>,
      timestamp: new Date().toLocaleTimeString()
    });
    setTestingRole(null);
  };

  const testGetMe = async () => {
    setTestingRole('me');
    try {
      const freshUser = await authService.getMe();
      setTestResult({
        endpoint: '/api/auth/me',
        roleRequired: 'ANY (Authenticated)',
        status: 200,
        data: { success: true, message: 'Profile verified via JWT', data: { user: freshUser } },
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: unknown) {
      setTestResult({
        endpoint: '/api/auth/me',
        roleRequired: 'ANY',
        status: 401,
        data: { success: false, message: err instanceof Error ? err.message : 'Unauthorized' },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTestingRole(null);
    }
  };

  const getRoleBadgeStyle = (role?: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SALES':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'WAREHOUSE':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'ACCOUNTS':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Top Navbar */}
        <header className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base leading-none">NexaERP</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Authentication & Role Access Demo</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 border border-slate-700 text-xs font-medium text-slate-300 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </header>

        {/* User Card */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-950">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{user?.name || 'Authenticated User'}</h3>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                {user?.role} ROLE
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">User ID</span>
                <span className="font-mono text-slate-300">{user?.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Session Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  JWT Authenticated
                </span>
              </div>
            </div>
          </div>

          {/* Token Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Active Bearer Token</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Signed by backend with secret & role claims.
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-400/90 break-all leading-tight max-h-16 overflow-y-auto">
                {token ? `${token.slice(0, 45)}...` : 'No token'}
              </div>
            </div>
            <button
              onClick={testGetMe}
              disabled={testingRole === 'me'}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Profile via /auth/me</span>
            </button>
          </div>
        </section>

        {/* Role Access Testing Matrix */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Role-Based Authorization Testing Suite</span>
            </div>
            <h4 className="text-xl font-bold text-slate-100">Live Endpoint Permission Matrix</h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              Click any button below to execute an authenticated request against the backend. The server will evaluate your JWT and return <span className="text-emerald-400 font-mono">200 OK</span> if your role is allowed, or <span className="text-rose-400 font-mono">403 Forbidden</span> if denied.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => runRoleTest('admin')}
              disabled={testingRole === 'admin'}
              className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
                <span>ADMIN ROUTE</span>
                <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 block truncate">/test/admin</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Requires: ADMIN</span>
            </button>

            <button
              onClick={() => runRoleTest('sales')}
              disabled={testingRole === 'sales'}
              className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
                <span>SALES ROUTE</span>
                <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 block truncate">/test/sales</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Requires: SALES</span>
            </button>

            <button
              onClick={() => runRoleTest('warehouse')}
              disabled={testingRole === 'warehouse'}
              className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/15 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-indigo-400 text-xs font-bold mb-1">
                <span>WAREHOUSE</span>
                <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 block truncate">/test/warehouse</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Requires: WAREHOUSE</span>
            </button>

            <button
              onClick={() => runRoleTest('accounts')}
              disabled={testingRole === 'accounts'}
              className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/15 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-cyan-400 text-xs font-bold mb-1">
                <span>ACCOUNTS</span>
                <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 block truncate">/test/accounts</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Requires: ACCOUNTS</span>
            </button>
          </div>

          {/* Live Response Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Live Server Response Console:</span>
              </span>
              {testResult && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Checked at {testResult.timestamp}
                </span>
              )}
            </div>

            {testResult ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {testResult.endpoint}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Req: {testResult.roleRequired})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {testResult.status === 200 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        200 OK — Allowed
                      </span>
                    ) : testResult.status === 403 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-800">
                        <XCircle className="w-3 h-3" />
                        403 Forbidden — Denied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
                        {testResult.status} Error
                      </span>
                    )}
                  </div>
                </div>

                <pre className="text-xs font-mono text-slate-300 overflow-x-auto bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500 font-mono">
                Click any of the test buttons above to trigger live role authorization verification.
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600">
          NexaERP Auth Checkpoint • Fully Connected to Supabase Database
        </footer>
      </div>
    </div>
  );
};

export default AuthDemoPage;
