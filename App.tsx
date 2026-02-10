import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './app/(auth)/login/Login';
import DashboardPage from './app/admin/dashboard/Dashboard';
import SettingsPage from './app/admin/settings/Settings';
import InsumosPage from './app/admin/insumos/Insumos';
import ObrasPage from './app/admin/obras/Obras';
import PlaceholderPage from './app/admin/placeholders/Placeholder';
import ObraRoot from './app/admin/obra/ObraRoot';
import ObraOverview from './app/admin/obra/pages/ObraOverview';
import ObraInventory from './app/admin/obra/pages/ObraInventory';
import ObraMovements from './app/admin/obra/pages/ObraMovements';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';

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
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected Admin Routes Wrapper */}
          <Route 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }
          >
            {/* System General */}
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />

            {/* Obras Management (List/Create) */}
            <Route path="/admin/obras" element={<ObrasPage />} />
            
            {/* Orçamento */}
            <Route path="/admin/insumos" element={<InsumosPage />} />
            <Route 
              path="/admin/unidades" 
              element={
                <PlaceholderPage 
                  title="Unidades de Medidas" 
                  description="Gerenciamento de unidades de medida para insumos e serviços."
                />
              } 
            />
            <Route 
              path="/admin/categorias" 
              element={
                <PlaceholderPage 
                  title="Categorias de Insumos" 
                  description="Gerenciamento de grupos e categorias para classificação de materiais."
                />
              } 
            />

            {/* Acesso ao Sistema */}
            <Route 
              path="/admin/perfis" 
              element={
                <PlaceholderPage 
                  title="Perfis de Acesso" 
                  description="Configuração de permissões e regras de acesso por tipo de usuário."
                />
              } 
            />
            <Route 
              path="/admin/usuarios" 
              element={
                <PlaceholderPage 
                  title="Usuários do Sistema" 
                  description="Cadastro de operadores, almoxarifes e administradores."
                />
              } 
            />

            {/* Individual Obra Routes */}
            <Route path="/admin/obra/:id" element={<ObraRoot />}>
               <Route index element={<Navigate to="overview" replace />} />
               <Route path="overview" element={<ObraOverview />} />
               <Route path="inventory" element={<ObraInventory />} />
               <Route path="movements" element={<ObraMovements />} />
               <Route path="settings" element={
                  <PlaceholderPage 
                    title="Configurações da Obra" 
                    description="Ajustes específicos para este projeto." 
                  />
               } />
            </Route>
          </Route>

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