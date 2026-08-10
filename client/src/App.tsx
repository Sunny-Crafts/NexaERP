import { useState } from 'react';
import { 
  Layers, 
  Server, 
  Database, 
  Activity, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { checkApiHealth } from './services/api';

function App() {
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({
    checked: false,
    loading: false
  });

  const handleCheckHealth = async () => {
    setHealthStatus(prev => ({ ...prev, loading: true }));
    const result = await checkApiHealth();
    setHealthStatus({
      checked: true,
      loading: false,
      success: result.success,
      message: result.message
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-3xl w-full z-10 space-y-8">
        {/* Top badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Initialized</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            NexaERP
          </h1>
          <p className="text-xl sm:text-2xl text-slate-400 font-medium">
            Mini ERP + CRM Operations Portal
          </p>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Full-stack enterprise resource planning and client management architecture scaffolded for high-efficiency operations.
          </p>
        </div>

        {/* API Health Check Interactive Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">System Health Monitor</h3>
                <p className="text-xs text-slate-400">GET /api/health</p>
              </div>
            </div>
            <button
              onClick={handleCheckHealth}
              disabled={healthStatus.loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthStatus.loading ? 'animate-spin' : ''}`} />
              {healthStatus.loading ? 'Checking...' : 'Check API Status'}
            </button>
          </div>

          {healthStatus.checked ? (
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
              healthStatus.success 
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
            }`}>
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${healthStatus.success ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div className="space-y-1">
                <div className="font-semibold">
                  {healthStatus.success ? 'Backend Online & Operational' : 'Backend Connection Notice'}
                </div>
                <div className="font-mono text-[11px] opacity-90">
                  {healthStatus.message}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono py-1">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Ready for initial API ping verification</span>
            </div>
          )}
        </div>

        {/* Stack Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <Layers className="w-4 h-4" />
              <span>Frontend</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              React, TypeScript, Vite, and Tailwind CSS configured with modular component directory scaffolding.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 text-sm font-semibold">
              <Server className="w-4 h-4" />
              <span>Backend</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Express.js with TypeScript, structured into controllers, services, middleware, and validators.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
              <Database className="w-4 h-4" />
              <span>Database Layer</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              PostgreSQL schema scaffolded with Prisma ORM (ready for data modeling in upcoming phases).
            </p>
          </div>
        </div>

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-600 pt-4">
          NexaERP Architecture • Project Initialized Successfully
        </footer>
      </main>
    </div>
  );
}

export default App;
