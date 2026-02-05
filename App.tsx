import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './app/(auth)/login/Login';
import DashboardPage from './app/admin/dashboard/Dashboard';
import SettingsPage from './app/admin/settings/Settings';
import InsumosPage from './app/admin/insumos/Insumos';
import ObrasPage from './app/admin/obras/Obras';
import PlaceholderPage from './app/admin/placeholders/Placeholder';
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

          {/* Obras Route */}
          <Route 
            path="/admin/obras" 
            element={
              <ProtectedRoute>
                <ObrasPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Orçamento - Insumos Route */}
          <Route 
            path="/admin/insumos" 
            element={
              <ProtectedRoute>
                <InsumosPage />
              </ProtectedRoute>
            } 
          />

          {/* Orçamento - New Routes */}
          <Route 
            path="/admin/unidades" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Unidades de Medidas" 
                  description="Gerenciamento de unidades de medida para insumos e serviços."
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categorias" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Categorias de Insumos" 
                  description="Gerenciamento de grupos e categorias para classificação de materiais."
                />
              </ProtectedRoute>
            } 
          />

          {/* Acesso ao Sistema - New Routes */}
          <Route 
            path="/admin/perfis" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Perfis de Acesso" 
                  description="Configuração de permissões e regras de acesso por tipo de usuário."
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/usuarios" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Usuários do Sistema" 
                  description="Cadastro de operadores, almoxarifes e administradores."
                />
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