import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../../../services/inventoryService';
import { settingsService } from '../../../services/settingsService';
import { collaboratorService } from '../../../services/collaboratorService';
import { userService } from '../../../services/userService';
import {
	Users,
	FileText,
	Tag,
	HardHat,
	ArrowRight,
	Clock,
	Plus,
	Database,
	Settings2,
	Loader2,
} from 'lucide-react';

const SettingsDashboard: React.FC = () => {
	const { currentTheme } = useTheme();
	const navigate = useNavigate();

	const [stats, setStats] = useState({
		insumos: 0,
		categorias: 0,
		colaboradores: 0,
		usuarios: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const [items, cats, collabs, users] = await Promise.all([
					inventoryService.getAll(),
					settingsService.getCategories(),
					collaboratorService.getAll(),
					userService.getAll(),
				]);
				setStats({
					insumos: items.length,
					categorias: cats.length,
					colaboradores: collabs.length,
					usuarios: users.length,
				});
			} catch (error) {
				console.error('Failed to fetch settings stats', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchStats();
	}, []);

	// Mock data removed. We hide the activity section until real audit logs are implemented.
	const recentActivity: any[] = [];

	const quickActions = [
		{
			label: 'Novo Insumo',
			icon: FileText,
			path: '/admin/insumos?action=new',
			description: 'Cadastre materiais e serviços',
			color: 'text-blue-500',
			bg: 'bg-blue-500/10',
		},
		{
			label: 'Nova Categoria',
			icon: Tag,
			path: '/admin/categorias?action=new',
			description: 'Organize itens em grupos',
			color: 'text-purple-500',
			bg: 'bg-purple-500/10',
		},
		{
			label: 'Novo Colaborador',
			icon: HardHat,
			path: '/admin/colaboradores?action=new',
			description: 'Registre funcionários e terceiros',
			color: 'text-orange-500',
			bg: 'bg-orange-500/10',
		},
		{
			label: 'Novo Usuário',
			icon: Users,
			path: '/admin/usuarios?action=new',
			description: 'Adicione acessos ao sistema',
			color: 'text-green-500',
			bg: 'bg-green-500/10',
		},
	];

	const statCards = [
		{ label: 'Insumos', value: stats.insumos, icon: Database },
		{ label: 'Categorias', value: stats.categorias, icon: Tag },
		{ label: 'Colaboradores', value: stats.colaboradores, icon: HardHat },
		{ label: 'Usuários', value: stats.usuarios, icon: Users },
	];

	const QuickActionButton = ({
		action,
	}: {
		action: (typeof quickActions)[0];
	}) => (
		<button
			onClick={() => navigate(action.path)}
			className="group flex items-start gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left h-full relative overflow-hidden"
			style={{
				backgroundColor: currentTheme.colors.card,
				borderColor: currentTheme.colors.border,
				color: currentTheme.colors.text,
			}}
		>
			<div
				className={`p-3 rounded-xl mb-3 shrink-0 ${action.bg} ${action.color}`}
			>
				<action.icon size={24} />
			</div>
			<div>
				<span className="block text-base font-semibold mb-1 group-hover:underline decoration-2 underline-offset-4">
					{action.label}
				</span>
				<span
					className="text-xs opacity-70 leading-relaxed block"
					style={{ color: currentTheme.colors.textSecondary }}
				>
					{action.description}
				</span>
			</div>
			<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
				<ArrowRight
					size={16}
					style={{ color: currentTheme.colors.textSecondary }}
				/>
			</div>
		</button>
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<Loader2
					className="animate-spin w-8 h-8 opacity-50"
					style={{ color: currentTheme.colors.primary }}
				/>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-8 space-y-8 w-full animate-in fade-in duration-500">
			<div
				className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6"
				style={{ borderColor: currentTheme.colors.border }}
			>
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
						<Settings2 size={32} />
					</div>
					<div>
						<h1
							className="text-3xl font-bold tracking-tight"
							style={{ color: currentTheme.colors.text }}
						>
							Configurações de Dados
						</h1>
						<p
							className="text-base mt-1"
							style={{
								color: currentTheme.colors.textSecondary,
							}}
						>
							Gerencie os dados mestres e configurações do sistema
						</p>
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((stat, idx) => (
					<div
						key={idx}
						className="p-5 rounded-2xl border flex items-center justify-between transition-all hover:border-[color:var(--highlight)] hover:shadow-md"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
							// @ts-ignore
							'--highlight': currentTheme.colors.primary,
						}}
					>
						<div>
							<p
								className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70"
								style={{
									color: currentTheme.colors.textSecondary,
								}}
							>
								{stat.label}
							</p>
							<p
								className="text-2xl font-bold"
								style={{ color: currentTheme.colors.text }}
							>
								{stat.value}
							</p>
						</div>
						<div
							className="p-2.5 rounded-lg opacity-80"
							style={{
								backgroundColor: `${currentTheme.colors.primary}10`,
								color: currentTheme.colors.primary,
							}}
						>
							<stat.icon size={20} />
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
				{/* Quick Actions Grid */}
				<section className="space-y-4">
					<h2
						className="text-lg font-semibold flex items-center gap-2"
						style={{ color: currentTheme.colors.text }}
					>
						<Plus size={20} className="text-emerald-500" />
						Acesso Rápido
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
						{quickActions.map((action, idx) => (
							<QuickActionButton key={idx} action={action} />
						))}
					</div>
				</section>
			</div>
		</div>
	);
};

export default SettingsDashboard;
