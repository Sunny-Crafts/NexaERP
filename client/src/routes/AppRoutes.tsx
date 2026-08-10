import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { 
  LoginPage, 
  AuthDemoPage, 
  CustomerListPage, 
  CustomerFormPage, 
  CustomerDetailPage 
} from '../pages';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs font-mono">Verifying authentication session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading NexaERP...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Auth & RBAC Testing Page */}
      <Route
        path="/demo"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AuthDemoPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Customer CRM Module Routes */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerFormPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CustomerFormPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirection */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/customers" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
