import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Layout components
import Layout from './components/layout/Layout';
// Auth pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
// User pages
import UserDashboard from './pages/user/UserDashboard';
import UserAssets from './pages/user/UserAssets';
import UserIssues from './pages/user/UserIssues';
// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AssetManagement from './pages/admin/AssetManagement';
import IssueManagement from './pages/admin/IssueManagement';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
// Shared pages
import AssetDetails from './pages/shared/AssetDetails';
import NotificationsPage from './pages/shared/NotificationsPage';
// Protected route component
const ProtectedRoute = ({
  children,
  requiredRole
}) => {
  const {
    user,
    isAuthenticated
  } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};
export function App() {
  return <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>}>
                {/* User routes */}
                <Route index element={<UserDashboard />} />
                <Route path="my-assets" element={<UserAssets />} />
                <Route path="my-issues" element={<UserIssues />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="assets/:assetId" element={<AssetDetails />} />
                {/* Admin routes */}
                <Route path="admin" element={<ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>} />
                <Route path="admin/assets" element={<ProtectedRoute requiredRole="admin">
                      <AssetManagement />
                    </ProtectedRoute>} />
                <Route path="admin/issues" element={<ProtectedRoute requiredRole="admin">
                      <IssueManagement />
                    </ProtectedRoute>} />
                <Route path="admin/users" element={<ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>} />
                <Route path="admin/departments" element={<ProtectedRoute requiredRole="admin">
                      <DepartmentManagement />
                    </ProtectedRoute>} />
              </Route>
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>;
}