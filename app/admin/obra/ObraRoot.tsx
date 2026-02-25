import React, { useEffect, useState, useMemo } from 'react';
import {
	useParams,
	NavLink,
	Outlet,
	useNavigate,
	useLocation,
} from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { constructionService } from '../../../services/constructionService';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { ConstructionSite } from '../../../types';
import {
	LayoutDashboard,
	Package,
	ArrowLeftRight,
	Loader2,
	Hammer,
	Truck,
	HardHat,
	Menu,
	X,
	ChevronLeft,
	ChevronRight,
	Building2,
} from 'lucide-react';

const ObraRoot: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { currentTheme } = useTheme();
	const { hasPermission } = usePermissions();
	const [site, setSite] = useState<ConstructionSite | null>(null);
	const [loading, setLoading] = useState(true);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [hoveredTooltip, setHoveredTooltip] = useState<{
		label: string;
		top: number;
		left: number;
	} | null>(null);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
		const saved = localStorage.getItem('obralog_obra_sidebar_collapsed');
		return saved === 'true';
	});

	const toggleSidebar = () => {
		const newState = !isSidebarCollapsed;
		setIsSidebarCollapsed(newState);
		localStorage.setItem(
			'obralog_obra_sidebar_collapsed',
			String(newState),
		);
	};

	useEffect(() => {
		const fetchSite = async () => {
			if (!id) return;
			try {
				const data = await constructionService.getById(id);
				if (data) {
					setSite(data);
				} else {
					navigate('/admin/obras');
				}
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		fetchSite();
	}, [id, navigate]);

	// Close mobile menu on route change
	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [location.pathname]);

	const navItems = useMemo(() => {
		const items = [
			{
				path: 'overview',
				label: 'Visão Geral',
				icon: LayoutDashboard,
				permission: 'obra_overview',
			},
			{
				path: 'inventory',
				label: 'Almoxarifado',
				icon: Package,
				permission: 'obra_inventory',
			},
			{
				path: 'tools',
				label: 'Ferramentas',
				icon: Hammer,
				permission: 'obra_tools',
			},
			{
				path: 'epi',
				label: 'EPIs',
				icon: HardHat,
				permission: 'obra_epi',
			},
			{
				path: 'rented',
				label: 'Equip. Alugados',
				icon: Truck,
				permission: 'obra_rented',
			},
			{
				path: 'movements',
				label: 'Movimentações',
				icon: ArrowLeftRight,
				permission: 'obra_movements',
			},
		];

		return items.filter(
			(item) =>
				hasPermission(item.permission, 'view') ||
				hasPermission('obras', 'view'),
		); // Fallback to 'obras:view' for backward compatibility or general access
	}, [hasPermission]);

	const quickActions = useMemo(() => {
		const actions = [
			{
				label: 'Retirada EPI',
				icon: HardHat,
				action: () => navigate(`/admin/obra/${id}/epi`),
				permission: 'obra_epi',
			},
			{
				label: 'Empréstimo',
				icon: Hammer,
				action: () => navigate(`/admin/obra/${id}/tools`),
				permission: 'obra_tools',
			},
			{
				label: 'Novo Insumo',
				icon: Package,
				action: () => navigate(`/admin/obra/${id}/inventory`),
				permission: 'obra_inventory',
			},
			{
				label: 'Novo Equipamento',
				icon: Truck,
				action: () => navigate(`/admin/obra/${id}/rented`),
				permission: 'obra_rented',
			},
		];
		return actions.filter(
			(action) =>
				hasPermission(action.permission, 'create') ||
				hasPermission('obras', 'create'),
		);
	}, [id, navigate, hasPermission]);

	if (loading) {
		return (
			<div className="h-full w-full flex items-center justify-center">
				<Loader2
					className="animate-spin h-8 w-8"
					style={{ color: currentTheme.colors.primary }}
				/>
			</div>
		);
	}

	if (!site) return null;

	const getSidebarItemStyle = (isActive: boolean) => ({
		backgroundColor: isActive
			? currentTheme.isDark ||
				['#000000', '#09090b', '#18181b'].includes(
					currentTheme.colors.sidebar,
				)
				? 'rgba(255,255,255,0.12)'
				: `${currentTheme.colors.primary}15`
			: 'transparent',
		color: currentTheme.colors.sidebarText,
		opacity: isActive ? 1 : 0.7,
		fontWeight: isActive ? 600 : 400,
	});

	const handleTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
		if (window.innerWidth < 768 || !isSidebarCollapsed) return;
		const rect = e.currentTarget.getBoundingClientRect();
		setHoveredTooltip({
			label,
			top: rect.top + rect.height / 2,
			left: rect.left - 10,
		});
	};

	const handleTooltipLeave = () => setHoveredTooltip(null);

	const currentPath = location.pathname.split('/').pop();
	const currentNavItem = navItems.find((item) => item.path === currentPath);
	const pageTitle = currentNavItem ? currentNavItem.label : '';

	return (
		<div className="flex flex-row h-full relative overflow-hidden">
			{/* Main Content Area */}
			<div
				className="flex-1 flex flex-col h-full overflow-hidden relative"
				style={{ backgroundColor: currentTheme.colors.background }}
			>
				{/* Page Title moved to TopBar */}
				<div
					className={`flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-24 md:pb-8 no-scrollbar`}
				>
					<Outlet />
				</div>
			</div>

			{/* Desktop Right Sidebar (Collapsible) */}
			<aside
				className={`hidden md:flex flex-col flex-shrink-0 border-l transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
				style={{
					backgroundColor: currentTheme.colors.sidebar,
					borderColor: currentTheme.colors.border,
					color: currentTheme.colors.sidebarText,
				}}
			>
				{/* Toggle Button */}
				<div
					onClick={toggleSidebar}
					className="absolute top-0 bottom-0 left-0 z-40 flex items-center justify-center cursor-pointer group"
					style={{ width: '0px' }}
				>
					<div
						className="relative w-5 h-10 flex items-center justify-center rounded-md shadow-sm transition-all duration-200 group-hover:scale-105"
						style={{
							backgroundColor: currentTheme.colors.sidebar,
							color: currentTheme.colors.sidebarText,
							border: `1px solid ${currentTheme.colors.border}`,
						}}
					>
						{isSidebarCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
					</div>
				</div>

				<nav
					className="p-4 pt-8 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar"
				>
					{navItems.map((item) => (
						<NavLink
							key={item.path}
							to={`/admin/obra/${id}/${item.path}`}
							onMouseEnter={(e) => handleTooltip(e, item.label)}
							onMouseLeave={handleTooltipLeave}
							className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-sm transition-all hover:bg-white/5 group relative`}
							style={({ isActive }) =>
								getSidebarItemStyle(isActive)
							}
						>
							<item.icon size={18} className="flex-shrink-0" />
							{!isSidebarCollapsed && (
								<span className="whitespace-nowrap">
									{item.label}
								</span>
							)}
						</NavLink>
					))}
				</nav>
			</aside>

			{/* Mobile Bottom Navigation */}
			<div
				className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center p-2 pb-safe z-40"
				style={{
					backgroundColor: currentTheme.colors.card,
					borderColor: currentTheme.colors.border,
				}}
			>
				{navItems.slice(0, 3).map((item) => (
					<NavLink
						key={item.path}
						to={`/admin/obra/${id}/${item.path}`}
						className={({ isActive }) =>
							`p-3 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-50'}`
						}
						style={({ isActive }) => ({
							color: isActive
								? currentTheme.colors.primary
								: currentTheme.colors.text,
						})}
					>
						<item.icon size={24} />
						<span className="text-[10px]">
							{item.label.substring(0, 8)}
						</span>
					</NavLink>
				))}

				<button
					onClick={() => setIsMobileMenuOpen(true)}
					className="p-3 rounded-xl flex flex-col items-center gap-1 opacity-50 hover:opacity-100"
					style={{ color: currentTheme.colors.text }}
				>
					<Menu size={24} />
					<span className="text-[10px]">Menu</span>
				</button>
			</div>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setIsMobileMenuOpen(false)}
					/>

					{/* Content */}
					<div
						className="absolute inset-0 flex flex-col p-6 z-10"
						style={{
							backgroundColor: currentTheme.colors.background,
						}}
					>
						<div className="flex justify-between items-center mb-8">
							<div>
								<h2
									className="text-2xl font-bold"
									style={{ color: currentTheme.colors.text }}
								>
									Menu
								</h2>
								<p
									className="text-sm opacity-60"
									style={{
										color: currentTheme.colors
											.textSecondary,
									}}
								>
									{site.name}
								</p>
							</div>
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								className="p-2 rounded-full hover:bg-black/5"
								style={{ color: currentTheme.colors.text }}
							>
								<X size={28} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-8 pb-20 no-scrollbar">
							{/* Quick Actions Grid */}
							{quickActions.length > 0 && (
								<section>
									<h3
										className="text-sm font-bold opacity-50 mb-4 uppercase"
										style={{
											color: currentTheme.colors
												.textSecondary,
										}}
									>
										Ações Rápidas
									</h3>
									<div className="grid grid-cols-2 gap-4">
										{quickActions.map((qa, idx) => (
											<button
												key={idx}
												onClick={() => {
													qa.action();
													setIsMobileMenuOpen(false);
												}}
												className="p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors active:scale-95"
												style={{
													backgroundColor:
														currentTheme.colors
															.card,
													borderColor:
														currentTheme.colors
															.border,
													color: currentTheme.colors
														.text,
												}}
											>
												<div
													className="p-3 rounded-full bg-opacity-10"
													style={{
														backgroundColor:
															currentTheme.colors
																.primary + '20',
														color: currentTheme
															.colors.primary,
													}}
												>
													<qa.icon size={24} />
												</div>
												<span className="text-sm font-medium text-center">
													{qa.label}
												</span>
											</button>
										))}
									</div>
								</section>
							)}

							{/* All Navigation Links */}
							<section>
								<h3
									className="text-sm font-bold opacity-50 mb-4 uppercase"
									style={{
										color: currentTheme.colors
											.textSecondary,
									}}
								>
									Navegação
								</h3>
								<div className="flex flex-col gap-2">
									{navItems.map((item) => (
										<NavLink
											key={item.path}
											to={`/admin/obra/${id}/${item.path}`}
											onClick={() =>
												setIsMobileMenuOpen(false)
											}
											className={({ isActive }) => `
                                        flex items-center gap-4 p-4 rounded-xl border transition-all
                                        ${isActive ? 'border-opacity-100' : 'border-opacity-50'}
                                    `}
											style={({ isActive }) => ({
												backgroundColor:
													currentTheme.colors.card,
												borderColor: isActive
													? currentTheme.colors
															.primary
													: currentTheme.colors
															.border,
												color: isActive
													? currentTheme.colors
															.primary
													: currentTheme.colors.text,
											})}
										>
											<item.icon size={20} />
											<span className="font-medium">
												{item.label}
											</span>
										</NavLink>
									))}
								</div>
							</section>
						</div>
					</div>
				</div>
			)}

			{/* Tooltip for collapsed sidebar */}
			{hoveredTooltip && (
				<div
					className="fixed z-[100] px-3 py-2 text-sm font-medium rounded-md shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap"
					style={{
						top: hoveredTooltip.top,
						left: hoveredTooltip.left,
						transform: 'translate(-100%, -50%)',
						backgroundColor: currentTheme.colors.card,
						color: currentTheme.colors.text,
						border: `1px solid ${currentTheme.colors.border}`,
					}}
				>
					{hoveredTooltip.label}
				</div>
			)}
		</div>
	);
};

export default ObraRoot;
