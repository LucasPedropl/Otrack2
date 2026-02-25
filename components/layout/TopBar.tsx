import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { authService } from '../../services/authService';
import { accessProfileService } from '../../services/accessProfileService';
import { useConstructionSites } from '../../contexts/ConstructionSiteContext';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import {
	Search,
	Settings,
	Menu,
	LogOut,
	User as UserIcon,
	ChevronDown,
	LayoutDashboard,
	Package,
	Hammer,
	HardHat,
	Truck,
	ArrowLeftRight,
} from 'lucide-react';
import { User, AccessProfile } from '../../types';

interface TopBarProps {
	onToggleSettings: () => void;
	isSettingsOpen: boolean;
	hasSettingsAccess?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
	onToggleSettings,
	isSettingsOpen,
	hasSettingsAccess = true,
}) => {
	const { currentTheme } = useTheme();
	const { toggleMobileSidebar } = useSidebar();
	const { sites } = useConstructionSites(); // Get sites from context
	const navigate = useNavigate();
	const location = useLocation();

	const [user, setUser] = useState<User | null>(authService.getCurrentUser());
	const [profileName, setProfileName] = useState<string>('');
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Define page titles mapping for Obra pages
	const OBRA_PAGES: Record<string, string> = {
		overview: 'Visão Geral',
		inventory: 'Almoxarifado',
		tools: 'Ferramentas',
		epi: 'EPIs',
		rented: 'Equip. Alugados',
		movements: 'Movimentações',
	};

	const obraMatch = matchPath('/admin/obra/:id/:page', location.pathname);
	const currentObraId = obraMatch?.params.id;
	const currentPage = obraMatch?.params.page;

	const currentSite = useMemo(() => {
		return sites.find((s) => s.id === currentObraId);
	}, [sites, currentObraId]);

	const pageTitle = currentPage ? OBRA_PAGES[currentPage] : '';

	useEffect(() => {
		const fetchProfile = async () => {
			if (user?.profileId) {
				try {
					const profile = await accessProfileService.getById(
						user.profileId,
					);
					if (profile) setProfileName(profile.name);
				} catch (e) {
					console.error('Erro ao carregar perfil na TopBar', e);
				}
			} else if (user?.role) {
				// Fallback para role caso não tenha profileId
				const roles: Record<string, string> = {
					admin: 'Administrador',
					almoxarife: 'Almoxarife',
					operario: 'Operário',
				};
				setProfileName(roles[user.role] || user.role);
			}
		};
		fetchProfile();
	}, [user]);

	// Fechar menu ao clicar fora
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setIsUserMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleLogout = async () => {
		await authService.logout();
		navigate('/');
	};

	const getInitials = (name?: string) => {
		if (!name) return '??';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	return (
		<header
			className="backdrop-blur-sm sticky top-0 z-30 px-4 sm:px-8 py-4 flex gap-4 justify-between items-center transition-colors duration-300 relative"
			style={{
				backgroundColor: currentTheme.colors.sidebar,
			}}
		>
			{/* Linha de borda física */}
			<div
				className="absolute bottom-0 left-0 right-0 h-[1px]"
				style={{
					backgroundColor: currentTheme.colors.sidebarText,
					opacity: 0.12,
				}}
			/>

			{/* Esquerda: Trigger do Menu Mobile + Título da Página */}
			<div className="flex items-center gap-4">
				<button
					onClick={toggleMobileSidebar}
					className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
					style={{ color: currentTheme.colors.sidebarText }}
				>
					<Menu size={24} />
				</button>

				{/* Título da Página (Obra) */}
				{currentSite && pageTitle && (
					<div className="hidden md:flex items-center gap-3 ml-2 animate-in fade-in duration-300">
						<span
							className="font-medium opacity-60"
							style={{ color: currentTheme.colors.sidebarText }}
						>
							{currentSite.name}
						</span>
						<span className="bg-white/20 h-4 w-[1px] rounded-full mx-1" />
						<span
							className="font-bold text-lg"
							style={{ color: currentTheme.colors.sidebarText }}
						>
							{pageTitle}
						</span>
					</div>
				)}
			</div>

			{/* Direita: Pesquisa + Configurações + Perfil */}
			<div className="flex items-center gap-3 justify-end flex-1">
				{/* Barra de Pesquisa Global */}
				<div className="relative hidden md:block w-64">
					<Search
						className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50"
						style={{ color: currentTheme.colors.sidebarText }}
					/>
					<input
						type="text"
						placeholder="Pesquisar..."
						className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
						style={
							{
								backgroundColor: currentTheme.colors.card,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.text,
							} as any
						}
					/>
				</div>

				{/* Botão de Configurações - Sempre visível para acesso às configurações locais/dados */}
				{hasSettingsAccess && (
					<button
						onClick={() => {
							if (location.pathname === '/admin/dados') {
								navigate('/admin/dashboard');
							} else {
								navigate('/admin/dados');
							}
						}}
						className={`p-2 rounded-lg transition-all hover:bg-white/10`}
						style={{
							backgroundColor:
								location.pathname.startsWith('/admin/dados') ||
								isSettingsOpen
									? currentTheme.colors.primary
									: 'transparent',
							border: `1px solid ${location.pathname.startsWith('/admin/dados') || isSettingsOpen ? currentTheme.colors.primary : 'transparent'}`,
							color:
								location.pathname.startsWith('/admin/dados') ||
								isSettingsOpen
									? '#fff'
									: currentTheme.colors.sidebarText,
							opacity:
								location.pathname.startsWith('/admin/dados') ||
								isSettingsOpen
									? 1
									: 0.8,
						}}
						title="Configurações e Cadastros"
					>
						<Settings size={20} />
					</button>
				)}

				{/* Divisor */}
				<div
					className="h-6 w-px mx-1"
					style={{
						backgroundColor: currentTheme.colors.sidebarText,
						opacity: 0.12,
					}}
				></div>

				{/* Área do Perfil com Dropdown */}
				<div className="relative" ref={menuRef}>
					<button
						onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
						className="flex items-center space-x-3 p-1 rounded-lg hover:bg-white/5 transition-colors group"
					>
						<div className="text-right hidden sm:block">
							<p
								className="text-sm font-bold leading-none mb-1"
								style={{
									color: currentTheme.colors.sidebarText,
								}}
							>
								{user?.name || 'Usuário'}
							</p>
							<p
								className="text-[10px] uppercase tracking-wider font-semibold opacity-60"
								style={{
									color: currentTheme.colors.sidebarText,
								}}
							>
								{profileName || 'Carregando...'}
							</p>
						</div>

						<div
							className="h-9 w-9 rounded-full flex items-center justify-center font-bold border-2 text-sm relative transition-transform group-hover:scale-105"
							style={{
								backgroundColor: currentTheme.colors.card,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.primary,
							}}
						>
							{getInitials(user?.name)}
							<div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900"></div>
						</div>

						<ChevronDown
							size={14}
							className={`transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`}
							style={{
								color: currentTheme.colors.sidebarText,
								opacity: 0.5,
							}}
						/>
					</button>

					{/* Dropdown Menu */}
					{isUserMenuOpen && (
						<div
							className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border py-2 animate-in fade-in slide-in-from-top-2 duration-200"
							style={{
								backgroundColor: currentTheme.colors.card,
								borderColor: currentTheme.colors.border,
								zIndex: 100,
							}}
						>
							<div
								className="px-4 py-3 border-b mb-2"
								style={{
									borderColor: currentTheme.colors.border,
								}}
							>
								<p
									className="text-xs font-semibold opacity-50 uppercase mb-1"
									style={{ color: currentTheme.colors.text }}
								>
									Conta
								</p>
								<p
									className="text-sm font-medium truncate"
									style={{ color: currentTheme.colors.text }}
								>
									{user?.email}
								</p>
							</div>

							<button
								onClick={() => {
									navigate('/admin/settings');
									setIsUserMenuOpen(false);
								}}
								className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
								style={{ color: currentTheme.colors.text }}
								onMouseEnter={(e) =>
									(e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}15`)
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.backgroundColor =
										'transparent')
								}
							>
								<UserIcon size={16} />
								Meu Perfil / Aparência
							</button>

							<button
								onClick={handleLogout}
								className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
							>
								<LogOut size={16} />
								Sair do Sistema
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};
