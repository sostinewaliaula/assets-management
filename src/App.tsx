import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import ToastContainer from './components/ui/ToastContainer';
import Login from './pages/auth/Login';

// Toast container wrapper component
const ToastContainerWrapper = () => {
  const { toasts, dismissToast } = useNotifications();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
};
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AssetManagement from './pages/admin/AssetManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import IssueManagement from './pages/admin/IssueManagement';
import UserDashboard from './pages/user/UserDashboard';
import UserAssets from './pages/user/UserAssets';
import UserIssues from './pages/user/UserIssues';
import AssetDetails from './pages/shared/AssetDetails';
import NotificationsPage from './pages/shared/NotificationsPage';
import Settings from './pages/shared/Settings';
import { supabase } from './lib/supabase';
import { useSupabase } from './hooks/useSupabase';
import ConnectionStatus from './components/ui/ConnectionStatus';

function RoleIndexRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const target = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
  return <Navigate to={target} replace />;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function App() {
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Database connection check failed:', error);
          setDbStatus('error');
        } else {
          setDbStatus('connected');
        }
      } catch (error) {
        console.error('Database connection error:', error);
        setDbStatus('error');
      }
    };

    checkConnection();
  }, []);

  if (dbStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (dbStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Database Connection Failed</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Unable to connect to the database. Please check your Supabase configuration and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <ConnectionStatus />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<RoleIndexRedirect />} />
                <Route path="admin">
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="assets" element={<AssetManagement />} />
                  <Route path="assets/edit/:assetId" element={<AssetManagement />} />
                  <Route path="departments" element={<DepartmentManagement />} />
                  <Route path="issues" element={<IssueManagement />} />
                </Route>
                <Route path="user">
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<UserDashboard />} />
                  <Route path="assets" element={<UserAssets />} />
                  <Route path="issues" element={<UserIssues />} />
                </Route>
                <Route path="assets/:assetId" element={<AssetDetails />} />
                <Route path="shared">
                  <Route path="asset/:id" element={<AssetDetails />} />
                <Route path="notifications" element={<NotificationsPage />} />
                </Route>
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
          <ToastContainerWrapper />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;