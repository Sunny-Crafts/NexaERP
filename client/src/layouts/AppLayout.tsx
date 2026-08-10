import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users, 
  Package, 
  Boxes, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadge = (role?: Role) => {
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
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Operational Overview';
    if (path.startsWith('/customers')) return 'Customer CRM & Follow-ups';
    if (path.startsWith('/products')) return 'Product Catalog & Pricing';
    if (path.startsWith('/inventory')) return 'Inventory & Stock Ledger';
    if (path.startsWith('/challans')) return 'Sales Challans & Dispatch';
    if (path.startsWith('/demo')) return 'Auth & RBAC Access Matrix';
    return 'Portal';
  };

  // Role-based visibility for sidebar navigation
  const showCustomers = hasRole('ADMIN', 'SALES', 'ACCOUNTS');
  const showProducts = hasRole('ADMIN', 'SALES', 'WAREHOUSE');
  const showInventory = hasRole('ADMIN', 'WAREHOUSE');
  const showChallans = hasRole('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS');
  const showRbacDemo = hasRole('ADMIN');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-md shadow-emerald-950">
            N
          </div>
          <span className="font-bold text-slate-100 text-base">NexaERP</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 md:bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 p-4 sm:p-5 transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-emerald-950/50">
              N
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base tracking-tight leading-none">NexaERP</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Enterprise Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
              Modules & Workspace
            </div>

            {/* Dashboard (First item, all roles) */}
            <NavLink
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </NavLink>

            {/* Customer CRM */}
            {showCustomers && (
              <NavLink
                to="/customers"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Customer CRM</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </NavLink>
            )}

            {/* Product Catalog */}
            {showProducts && (
              <NavLink
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Product Catalog</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </NavLink>
            )}

            {/* Inventory & Stock */}
            {showInventory && (
              <NavLink
                to="/inventory"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  <span>Inventory & Stock</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </NavLink>
            )}

            {/* Sales Challans */}
            {showChallans && (
              <NavLink
                to="/challans"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Sales Challans</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </NavLink>
            )}

            {/* Auth & RBAC Demo (Admin only or Testing) */}
            {showRbacDemo && (
              <NavLink
                to="/demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Auth & RBAC Demo</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getRoleBadge(user?.role)}`}>
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 border border-slate-700/80 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">Portal /</span>
            <span className="text-slate-200 font-medium">{getPageTitle(location.pathname)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user?.name}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRoleBadge(user?.role)}`}>
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-800 text-slate-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
