import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './app/(auth)/login/Login';
import DashboardPage from './app/admin/dashboard/Dashboard';
import SettingsPage from './app/admin/settings/Settings';
import InsumosPage from './app/admin/insumos/Insumos';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';

// Basic wrapper to protect routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Inventory/Insumos Route */}
          <Route 
            path="/admin/insumos" 
            element={
              <ProtectedRoute>
                <InsumosPage />
              </ProtectedRoute>
            } 
          />

          {/* Legacy redirect for old bookmark safety */}
          <Route path="/admin/inventory" element={<Navigate to="/admin/insumos" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;