import React, { useEffect, useState } from 'react';
import { inventoryService } from '../../../services/inventoryService';
import { InventoryItem } from '../../../types';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import {
	AlertTriangle,
	Package,
	TrendingUp,
	DollarSign,
	Loader2,
	ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{
	title: string;
	value: string;
	icon: React.ElementType;
	trend?: string;
	colorClass: string;
	theme: any;
}> = ({ title, value, icon: Icon, trend, colorClass, theme }) => (
	<div
		className="p-6 rounded-xl shadow-sm border transition-all hover:shadow-md"
		style={{
			backgroundColor: theme.colors.card,
			borderColor: theme.colors.border,
		}}
	>
		<div className="flex items-start justify-between">
			<div>
				<p
					className="text-sm font-medium"
					style={{ color: theme.colors.textSecondary }}
				>
					{title}
				</p>
				<h3
					className="text-2xl font-bold mt-2"
					style={{ color: theme.colors.text }}
				>
					{value}
				</h3>
			</div>
			<div className={`p-3 rounded-lg ${colorClass}`}>
				<Icon className="h-6 w-6 text-white" />
			</div>
		</div>
		{trend && (
			<p className="text-xs font-medium text-emerald-500 mt-4 flex items-center bg-emerald-500/10 w-fit px-2 py-1 rounded">
				<TrendingUp className="h-3 w-3 mr-1" /> {trend}
			</p>
		)}
	</div>
);

const DashboardPage: React.FC = () => {
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { currentTheme } = useTheme();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchItems = async () => {
			try {
				const data = await inventoryService.getAll();
				setItems(data);
			} catch (error) {
				console.error('Failed to fetch inventory', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchItems();
	}, []);

	const lowStockItems = items.filter((i) => i.quantity <= i.minThreshold);
	const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
	const distinctItems = items.length;
	const estimatedValue = items.reduce(
		(acc, curr) => acc + curr.quantity * (curr.unitValue || 0),
		0,
	);

	// Take top 10 items by quantity for the chart
	const topItems = [...items]
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 10);
	const chartData = topItems.map((i) => ({
		name: i.name,
		quantidade: i.quantity,
	}));

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
				<div>
					<h1
						className="text-3xl font-bold"
						style={{ color: currentTheme.colors.text }}
					>
						Visão Geral
					</h1>
					<p
						className="text-base mt-1"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Monitoramento em tempo real do estoque
					</p>
				</div>
				<button
					onClick={() => navigate('/admin/insumos')}
					className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
					style={{
						backgroundColor: currentTheme.colors.primary,
						color: '#FFF',
					}}
				>
					Gerenciar Estoque
					<ArrowRight size={16} />
				</button>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
				<StatCard
					title="Itens Cadastrados"
					value={distinctItems.toString()}
					icon={Package}
					colorClass="bg-blue-500"
					theme={currentTheme}
				/>
				<StatCard
					title="Estoque Total"
					value={totalItems.toLocaleString('pt-BR')}
					icon={TrendingUp}
					colorClass="bg-emerald-500"
					theme={currentTheme}
				/>
				<StatCard
					title="Alertas de Estoque"
					value={lowStockItems.length.toString()}
					icon={AlertTriangle}
					colorClass="bg-orange-500"
					theme={currentTheme}
				/>
				<StatCard
					title="Valor Estimado"
					value={estimatedValue.toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					})}
					icon={DollarSign}
					colorClass="bg-indigo-500"
					theme={currentTheme}
				/>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Chart Section */}
				<div
					className="xl:col-span-2 p-6 rounded-2xl border shadow-sm"
					style={{
						backgroundColor: currentTheme.colors.card,
						borderColor: currentTheme.colors.border,
					}}
				>
					<h3
						className="text-lg font-bold mb-6"
						style={{ color: currentTheme.colors.text }}
					>
						Níveis de Estoque (Top 10)
					</h3>
					<div className="h-80 w-full" style={{ minWidth: 0 }}>
						{chartData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={chartData}
									margin={{
										top: 20,
										right: 30,
										left: 20,
										bottom: 5,
									}}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke={currentTheme.colors.border}
										opacity={0.5}
									/>
									<XAxis
										dataKey="name"
										tick={{
											fontSize: 12,
											fill: currentTheme.colors
												.textSecondary,
										}}
										stroke={currentTheme.colors.border}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										tick={{
											fontSize: 12,
											fill: currentTheme.colors
												.textSecondary,
										}}
										stroke={currentTheme.colors.border}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										cursor={{
											fill: currentTheme.colors.text,
											opacity: 0.05,
										}}
										contentStyle={{
											backgroundColor:
												currentTheme.colors.card,
											borderColor:
												currentTheme.colors.border,
											color: currentTheme.colors.text,
											borderRadius: '12px',
											boxShadow:
												'0 4px 6px -1px rgb(0 0 0 / 0.1)',
										}}
										itemStyle={{
											color: currentTheme.colors.text,
										}}
									/>
									<Bar
										dataKey="quantidade"
										fill={currentTheme.colors.primary}
										radius={[6, 6, 0, 0]}
										barSize={50}
										activeBar={{ fillOpacity: 0.8 }}
									/>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center flex-col gap-2 opacity-50">
								<Package size={48} />
								<p>Nenhum dado para exibir</p>
							</div>
						)}
					</div>
				</div>

				{/* Alerts Section */}
				<div
					className="p-6 rounded-2xl border shadow-sm flex flex-col h-full"
					style={{
						backgroundColor: currentTheme.colors.card,
						borderColor: currentTheme.colors.border,
					}}
				>
					<div className="flex items-center justify-between mb-6">
						<h3
							className="text-lg font-bold"
							style={{ color: currentTheme.colors.text }}
						>
							Alertas
						</h3>
						{lowStockItems.length > 0 && (
							<span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
								{lowStockItems.length} Críticos
							</span>
						)}
					</div>

					<div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
						{lowStockItems.length > 0 ? (
							lowStockItems.map((item, idx) => (
								<div
									key={idx}
									className="flex items-start p-4 rounded-xl border bg-red-500/5 border-red-500/10 group hover:bg-red-500/10 transition-colors cursor-pointer"
									onClick={() =>
										navigate(
											`/admin/insumos?search=${item.name}`,
										)
									}
								>
									<div className="p-2 rounded-lg bg-red-500/10 text-red-500 mr-4 shrink-0">
										<AlertTriangle className="h-5 w-5" />
									</div>
									<div>
										<p
											className="font-semibold text-sm"
											style={{
												color: currentTheme.colors.text,
											}}
										>
											{item.name}
										</p>
										<p className="text-xs mt-1 text-red-500 font-medium">
											Estoque atual: {item.quantity}{' '}
											{item.unit}
										</p>
										<p
											className="text-xs opacity-60 mt-0.5"
											style={{
												color: currentTheme.colors
													.textSecondary,
											}}
										>
											Mínimo: {item.minThreshold}{' '}
											{item.unit}
										</p>
									</div>
								</div>
							))
						) : (
							<div
								className="text-center py-12 px-4 rounded-xl border border-dashed"
								style={{
									borderColor: currentTheme.colors.border,
								}}
							>
								<div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
									<TrendingUp className="h-6 w-6 text-emerald-500" />
								</div>
								<p
									className="text-sm font-medium"
									style={{ color: currentTheme.colors.text }}
								>
									Tudo em ordem!
								</p>
								<p
									className="text-xs mt-1 opacity-60"
									style={{
										color: currentTheme.colors
											.textSecondary,
									}}
								>
									Nenhum alerta de estoque baixo detectado.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardPage;
