
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './app/(auth)/login/Login';
import DashboardPage from './app/admin/dashboard/Dashboard';
import SettingsPage from './app/admin/settings/Settings';
import InsumosPage from './app/admin/insumos/Insumos';
import ObrasPage from './app/admin/obras/Obras';
import UnidadesPage from './app/admin/unidades/UnidadesPage';
import CategoriasPage from './app/admin/categorias/CategoriasPage';
import PlaceholderPage from './app/admin/placeholders/Placeholder';
import ObraRoot from './app/admin/obra/ObraRoot';
import ObraOverview from './app/admin/obra/pages/ObraOverview';
import ObraInventory from './app/admin/obra/pages/ObraInventory';
import ObraMovements from './app/admin/obra/pages/ObraMovements';
import ObraTools from './app/admin/obra/pages/ObraTools';
import ObraRented from './app/admin/obra/pages/ObraRented';
import PerfisPage from './app/admin/perfis/PerfisPage';
import UsuariosPage from './app/admin/usuarios/UsuariosPage';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { PermissionsProvider, usePermissions } from './contexts/PermissionsContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Componente para bloquear acesso a módulos sem permissão
const PermissionGate: React.FC<{ module: string; action?: string; children: React.ReactNode }> = ({ module, action = 'view', children }) => {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!hasPermission(module, action)) {
      // Se não tem acesso, joga pro dashboard (que é o local seguro padrão)
      return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PermissionsProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route element={<ProtectedRoute><AdminLayout><Outlet /></AdminLayout></ProtectedRoute>}>
              
              {/* Dashboard tem sua própria verificação interna de permissão no PermissionGate */}
              <Route path="/admin/dashboard" element={<PermissionGate module="dashboard"><DashboardPage /></PermissionGate>} />
              <Route path="/admin/settings" element={<SettingsPage />} />

              <Route path="/admin/obras" element={<PermissionGate module="obras"><ObrasPage /></PermissionGate>} />
              
              <Route path="/admin/insumos" element={<PermissionGate module="orcamento_insumos"><InsumosPage /></PermissionGate>} />
              <Route path="/admin/unidades" element={<PermissionGate module="orcamento_unidades"><UnidadesPage /></PermissionGate>} />
              <Route path="/admin/categorias" element={<PermissionGate module="orcamento_categorias"><CategoriasPage /></PermissionGate>} />

              <Route path="/admin/perfis" element={<PermissionGate module="acesso_perfis"><PerfisPage /></PermissionGate>} />
              <Route path="/admin/usuarios" element={<PermissionGate module="acesso_usuarios"><UsuariosPage /></PermissionGate>} />

              <Route path="/admin/obra/:id" element={<PermissionGate module="obras"><ObraRoot /></PermissionGate>}>
                 <Route index element={<Navigate to="overview" replace />} />
                 <Route path="overview" element={<ObraOverview />} />
                 <Route path="inventory" element={<ObraInventory />} />
                 <Route path="tools" element={<ObraTools />} />
                 <Route path="rented" element={<ObraRented />} />
                 <Route path="movements" element={<ObraMovements />} />
                 <Route path="settings" element={<PlaceholderPage title="Configurações da Obra" description="Ajustes específicos." />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </PermissionsProvider>
    </ThemeProvider>
  );
};

export default App;
