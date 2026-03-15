import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './app/(auth)/login/Login';
import DashboardPage from './app/admin/dashboard/Dashboard';
import SettingsPage from './app/admin/settings/Settings';
import SettingsDashboard from './app/admin/settings/SettingsDashboard';
import InsumosPage from './app/admin/insumos/Insumos';
import ObrasPage from './app/admin/obras/Obras';
import UnidadesPage from './app/admin/unidades/UnidadesPage';
import CategoriasPage from './app/admin/categorias/CategoriasPage';
import ColaboradoresPage from './app/admin/colaboradores/ColaboradoresPage';
import PlaceholderPage from './app/admin/placeholders/Placeholder';
import WorkspaceSwitcher from './app/(auth)/switcher/WorkspaceSwitcher';
import ObraRoot from './app/admin/obra/ObraRoot';
import ObraOverview from './app/admin/obra/pages/ObraOverview';
import ObraInventory from './app/admin/obra/pages/ObraInventory';
import ObraMovements from './app/admin/obra/pages/ObraMovements';
import ObraTools from './app/admin/obra/pages/ObraTools';
import ObraEPI from './app/admin/obra/pages/ObraEPI';
import ObraRented from './app/admin/obra/pages/ObraRented';
import PerfisPage from './app/admin/perfis/PerfisPage';
import UsuariosPage from './app/admin/usuarios/UsuariosPage';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import {
	PermissionsProvider,
	usePermissions,
} from './contexts/PermissionsContext';
import { ConstructionSiteProvider } from './contexts/ConstructionSiteContext';

import { ForcePasswordChange } from './components/auth/ForcePasswordChange';

import { ToastProvider } from './contexts/ToastContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const user = authService.getCurrentUser();
	const [checkTrigger, setCheckTrigger] = React.useState(0);

	if (!user) return <Navigate to="/" replace />;

	if (user.needsPasswordChange) {
		return (
			<ForcePasswordChange
				user={user}
				onSuccess={() => {
					// Força recarregamento para atualizar o user do storage
					window.location.reload();
				}}
			/>
		);
	}

	// Força seleção de workspace se houver mais de uma e nenhuma estiver ativa
	if (!user.activeWorkspaceId && user.workspaces?.length > 0) {
		// Ignora se for o único workspace para não prender em loop infinito se o syncUser/login não gravou antes
		if (user.workspaces.length === 1 && user.companyId) {
			// let it pass, is auto-selected
		} else {
			return <Navigate to="/switcher" replace />;
		}
	}

	return <>{children}</>;
};

// Componente para bloquear acesso a módulos sem permissão
const PermissionGate: React.FC<{
	module: string;
	action?: string;
	children: React.ReactNode;
}> = ({ module, action = 'view', children }) => {
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
			<ToastProvider>
				<PermissionsProvider>
					<ConstructionSiteProvider>
						<HashRouter
							future={{
								v7_startTransition: true,
								v7_relativeSplatPath: true,
							}}
						>
							<Routes>
								<Route path="/" element={<LoginPage />} />
								<Route
									path="/switcher"
									element={<WorkspaceSwitcher />}
								/>

								<Route
									element={
										<ProtectedRoute>
											<AdminLayout>
												<Outlet />
											</AdminLayout>
										</ProtectedRoute>
									}
								>
									{/* Dashboard tem sua própria verificação interna de permissão no PermissionGate */}
									<Route
										path="/admin/dashboard"
										element={
											<PermissionGate module="dashboard">
												<DashboardPage />
											</PermissionGate>
										}
									/>
									<Route
										path="/admin/settings"
										element={<SettingsPage />}
									/>
									<Route
										path="/admin/dados"
										element={<SettingsDashboard />}
									/>

									<Route
										path="/admin/obras"
										element={
											<PermissionGate module="obras">
												<ObrasPage />
											</PermissionGate>
										}
									/>

									<Route
										path="/admin/insumos"
										element={
											<PermissionGate module="orcamento_insumos">
												<InsumosPage />
											</PermissionGate>
										}
									/>
									<Route
										path="/admin/unidades"
										element={
											<PermissionGate module="orcamento_unidades">
												<UnidadesPage />
											</PermissionGate>
										}
									/>
									<Route
										path="/admin/categorias"
										element={
											<PermissionGate module="orcamento_categorias">
												<CategoriasPage />
											</PermissionGate>
										}
									/>

									<Route
										path="/admin/colaboradores"
										element={
											<PermissionGate module="mao_obra_colaboradores">
												<ColaboradoresPage />
											</PermissionGate>
										}
									/>

									<Route
										path="/admin/perfis"
										element={
											<PermissionGate module="acesso_perfis">
												<PerfisPage />
											</PermissionGate>
										}
									/>
									<Route
										path="/admin/usuarios"
										element={
											<PermissionGate module="acesso_usuarios">
												<UsuariosPage />
											</PermissionGate>
										}
									/>

									<Route
										path="/admin/obra/:id"
										element={
											<PermissionGate module="obras">
												<ObraRoot />
											</PermissionGate>
										}
									>
										<Route
											index
											element={
												<Navigate
													to="overview"
													replace
												/>
											}
										/>
										<Route
											path="overview"
											element={<ObraOverview />}
										/>
										<Route
											path="inventory"
											element={<ObraInventory />}
										/>
										<Route
											path="tools"
											element={<ObraTools />}
										/>
										<Route
											path="epi"
											element={<ObraEPI />}
										/>
										<Route
											path="rented"
											element={<ObraRented />}
										/>
										<Route
											path="movements"
											element={<ObraMovements />}
										/>
										<Route
											path="settings"
											element={
												<PlaceholderPage
													title="Configurações da Obra"
													description="Ajustes específicos."
												/>
											}
										/>
									</Route>
								</Route>

								<Route
									path="*"
									element={<Navigate to="/" replace />}
								/>
							</Routes>
						</HashRouter>
					</ConstructionSiteProvider>
				</PermissionsProvider>
			</ToastProvider>
		</ThemeProvider>
	);
};

export default App;
