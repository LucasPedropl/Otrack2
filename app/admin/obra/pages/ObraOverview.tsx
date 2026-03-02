import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { siteInventoryService } from '../../../../services/siteInventoryService';
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService';
import { toolService } from '../../../../services/toolService';
import {
	SiteInventoryItem,
	RentedEquipment,
	ToolLoan,
	StockMovement,
} from '../../../../types';
import {
	AlertTriangle,
	CheckCircle,
	TrendingUp,
	Truck,
	Hammer,
	DollarSign,
	ArrowUpRight,
	ArrowDownLeft,
	Package,
	Loader2,
	ArrowRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ObraOverview: React.FC = () => {
	const { id: siteId } = useParams<{ id: string }>();
	const { currentTheme } = useTheme();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);
	const [inventory, setInventory] = useState<SiteInventoryItem[]>([]);
	const [rented, setRented] = useState<RentedEquipment[]>([]);
	const [loans, setLoans] = useState<ToolLoan[]>([]);
	const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);

	useEffect(() => {
		const loadDashboardData = async () => {
			if (!siteId) return;
			try {
				const [invData, rentedData, loanData, movData] =
					await Promise.all([
						siteInventoryService.getSiteInventory(siteId),
						rentedEquipmentService.getAll(siteId),
						toolService.getActiveLoans(siteId),
						siteInventoryService.getAllSiteMovements(siteId),
					]);

				setInventory(invData);
				setRented(rentedData);
				setLoans(loanData);

				// Merge Rented events into movements for the feed
				const rentedMovements: StockMovement[] = [];
				rentedData.forEach((r) => {
					// Entry
					rentedMovements.push({
						id: `rent_in_${r.id}`,
						type: 'IN',
						date: r.entryDate,
						quantity: r.quantity,
						itemName: r.name,
						itemUnit: r.unit,
						userName: 'Sistema',
						reason: `Locação: ${r.supplier}`,
					});
					// Exit
					if (r.exitDate) {
						rentedMovements.push({
							id: `rent_out_${r.id}`,
							type: 'OUT',
							date: r.exitDate,
							quantity: r.quantity,
							itemName: r.name,
							itemUnit: r.unit,
							userName: 'Sistema',
							reason: 'Devolução Locação',
						});
					}
				});

				// Combine and Sort descending
				const combined = [...movData, ...rentedMovements]
					.sort((a, b) => b.date.getTime() - a.date.getTime())
					.slice(0, 7); // Show top 7

				setRecentMovements(combined);
			} catch (error) {
				console.error('Error loading overview', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadDashboardData();
	}, [siteId]);

	// --- Calculations ---
	const overdueLoans = loans.filter((l) => {
		if (l.status !== 'OPEN' || !l.loanDate) return false;
		const loanD = new Date(l.loanDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return loanD < today;
	});

	const handleReturnLoan = async (loanId: string) => {
		if (!siteId) return;
		if (!window.confirm('Confirmar devolução deste item?')) return;
		try {
			await toolService.returnLoan(siteId, loanId);
			// Update local state to remove from list immediately
			setLoans((prev) => prev.filter((l) => l.id !== loanId));
		} catch (e) {
			console.error(e);
			alert('Erro ao devolver item');
		}
	};

	const lowStockItems = inventory.filter(
		(i) => i.minThreshold > 0 && i.quantity <= i.minThreshold,
	);
	const totalValue = inventory.reduce(
		(acc, i) => acc + i.quantity * (i.averagePrice || 0),
		0,
	);
	const activeRentedCount = rented.filter(
		(r) => r.status === 'ACTIVE',
	).length;
	const activeLoansCount = loans.length;

	const formatCurrency = (val: number) =>
		new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(val);

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="animate-spin h-8 w-8 text-blue-500" />
			</div>
		);
	}

	const KPICard = ({
		title,
		value,
		icon: Icon,
		colorClass,
		onClick,
	}: any) => (
		<div
			onClick={onClick}
			className="p-5 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
			style={{
				backgroundColor: currentTheme.colors.card,
				borderColor: currentTheme.colors.border,
			}}
		>
			<div>
				<p
					className="text-sm font-medium opacity-70 mb-1"
					style={{ color: currentTheme.colors.textSecondary }}
				>
					{title}
				</p>
				<h3
					className="text-2xl font-bold"
					style={{ color: currentTheme.colors.text }}
				>
					{value}
				</h3>
			</div>
			<div className={`p-3 rounded-lg ${colorClass}`}>
				<Icon className="h-6 w-6 text-white" />
			</div>
		</div>
	);

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* KPI Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<KPICard
					title="Itens no Almoxarifado"
					value={inventory.length}
					icon={Package}
					colorClass="bg-blue-500"
					onClick={() => navigate('../inventory')}
				/>
				<KPICard
					title="Itens Abaixo do Mínimo"
					value={lowStockItems.length}
					icon={AlertTriangle}
					colorClass={
						lowStockItems.length > 0 ? 'bg-red-500' : 'bg-gray-400'
					}
					onClick={() => navigate('../inventory')}
				/>
				<KPICard
					title="Equipamentos Alugados"
					value={activeRentedCount}
					icon={Truck}
					colorClass="bg-purple-500"
					onClick={() => navigate('../rented')}
				/>
				<KPICard
					title="Ferramentas Emprestadas"
					value={activeLoansCount}
					icon={Hammer}
					colorClass="bg-orange-500"
					onClick={() => navigate('../tools')}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{/* Overdue Loans Widget - Always visible with different states */}
					<div
						className={`rounded-xl border overflow-hidden ${
							overdueLoans.length > 0
								? 'border-red-200'
								: 'border-emerald-200'
						}`}
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor:
								overdueLoans.length > 0
									? undefined
									: currentTheme.colors.border,
						}}
					>
						<div
							className={`p-4 border-b flex justify-between items-center ${
								overdueLoans.length > 0
									? 'bg-red-50/10'
									: 'bg-emerald-50/10'
							}`}
							style={{
								borderColor: currentTheme.colors.border,
							}}
						>
							<h3
								className={`text-lg font-bold flex items-center gap-2 ${
									overdueLoans.length > 0
										? 'text-red-600'
										: 'text-emerald-600'
								}`}
							>
								{overdueLoans.length > 0 ? (
									<AlertTriangle size={20} />
								) : (
									<CheckCircle size={20} />
								)}
								Empréstimos Atrasados
							</h3>
							{overdueLoans.length > 0 && (
								<span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
									{overdueLoans.length} pendentes
								</span>
							)}
						</div>

						{overdueLoans.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<tbody
										className="divide-y"
										style={{
											borderColor:
												currentTheme.colors.border,
										}}
									>
										{overdueLoans.map((loan) => (
											<tr
												key={loan.id}
												className="hover:bg-black/5 transition-colors"
											>
												<td
													className="p-3 font-medium"
													style={{
														color: currentTheme
															.colors.text,
													}}
												>
													{loan.itemName}
													<span className="ml-2 text-xs opacity-60 font-normal">
														({loan.quantity})
													</span>
												</td>
												<td
													className="p-3"
													style={{
														color: currentTheme
															.colors.text,
													}}
												>
													{loan.workerName}
												</td>
												<td className="p-3 text-red-500 font-semibold text-xs">
													{Math.floor(
														(new Date().getTime() -
															new Date(
																loan.loanDate,
															).getTime()) /
															(1000 *
																60 *
																60 *
																24),
													)}{' '}
													dias atrasado
												</td>
												<td className="p-3 text-right">
													<button
														onClick={() =>
															handleReturnLoan(
																loan.id!,
															)
														}
														className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
													>
														Devolver
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="p-8 text-center flex flex-col items-center justify-center opacity-60">
								<p
									style={{
										color: currentTheme.colors
											.textSecondary,
									}}
								>
									Nenhum empréstimo atrasado.
								</p>
							</div>
						)}
					</div>

					{/* Recent Activity Feed */}
					<div
						className="rounded-xl border p-6"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
						}}
					>
						<div className="flex justify-between items-center mb-6">
							<h3
								className="text-lg font-bold"
								style={{ color: currentTheme.colors.text }}
							>
								Últimas Movimentações
							</h3>
							<button
								onClick={() => navigate('../movements')}
								className="text-sm flex items-center gap-1 hover:underline"
								style={{ color: currentTheme.colors.primary }}
							>
								Ver tudo <ArrowRight size={14} />
							</button>
						</div>

						<div className="space-y-4">
							{recentMovements.length === 0 ? (
								<p
									className="text-center opacity-50 py-4"
									style={{ color: currentTheme.colors.text }}
								>
									Nenhuma atividade recente.
								</p>
							) : (
								recentMovements.map((mov, idx) => (
									<div
										key={mov.id || idx}
										className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50/50 transition-colors"
										style={{
											backgroundColor: currentTheme.isDark
												? 'rgba(255,255,255,0.02)'
												: '#f9fafb',
										}}
									>
										<div className="flex items-center gap-4">
											<div
												className={`p-2 rounded-full ${mov.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
											>
												{mov.type === 'IN' ? (
													<ArrowDownLeft size={18} />
												) : (
													<ArrowUpRight size={18} />
												)}
											</div>
											<div>
												<p
													className="font-medium text-sm"
													style={{
														color: currentTheme
															.colors.text,
													}}
												>
													{mov.itemName}{' '}
													<span className="opacity-60 text-xs font-normal">
														({mov.quantity}{' '}
														{mov.itemUnit})
													</span>
												</p>
												<p
													className="text-xs opacity-60"
													style={{
														color: currentTheme
															.colors
															.textSecondary,
													}}
												>
													{mov.userName || 'Sistema'}{' '}
													•{' '}
													{mov.reason || 'Sem motivo'}
												</p>
											</div>
										</div>
										<div
											className="text-right text-xs opacity-60"
											style={{
												color: currentTheme.colors
													.textSecondary,
											}}
										>
											{new Date(
												mov.date,
											).toLocaleDateString()}{' '}
											<br />
											{new Date(
												mov.date,
											).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Alerts / Actions */}
				<div className="space-y-6">
					{/* Low Stock Widget */}
					<div
						className="rounded-xl border p-6"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
						}}
					>
						<h3
							className="text-lg font-bold mb-4 flex items-center gap-2"
							style={{ color: currentTheme.colors.text }}
						>
							<AlertTriangle size={20} className="text-red-500" />
							Alertas de Estoque
						</h3>

						{lowStockItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-6 opacity-50 text-center">
								<Package
									size={32}
									className="mb-2 text-green-500"
								/>
								<p
									className="text-sm"
									style={{ color: currentTheme.colors.text }}
								>
									Tudo certo! Nenhum item abaixo do mínimo.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{lowStockItems.slice(0, 5).map((item) => (
									<div
										key={item.id}
										className="flex justify-between items-center p-2 rounded border-l-2 border-red-500 bg-red-50/10"
									>
										<div>
											<p
												className="text-sm font-medium"
												style={{
													color: currentTheme.colors
														.text,
												}}
											>
												{item.name}
											</p>
											<p className="text-xs text-red-500">
												Atual: {item.quantity}{' '}
												{item.unit}
											</p>
										</div>
										<div className="text-xs opacity-60 font-mono">
											Min: {item.minThreshold}
										</div>
									</div>
								))}
								{lowStockItems.length > 5 && (
									<button
										onClick={() => navigate('../inventory')}
										className="w-full text-center text-xs mt-2 hover:underline"
										style={{
											color: currentTheme.colors.primary,
										}}
									>
										Ver mais {lowStockItems.length - 5}{' '}
										itens...
									</button>
								)}
							</div>
						)}
					</div>

					{/* Quick Actions */}
					<div
						className="rounded-xl border p-6"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
						}}
					>
						<h3
							className="text-lg font-bold mb-4"
							style={{ color: currentTheme.colors.text }}
						>
							Acesso Rápido
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => navigate('../inventory')}
								className="p-3 rounded-lg border hover:bg-black/5 transition-colors text-center flex flex-col items-center gap-2"
								style={{
									borderColor: currentTheme.colors.border,
									color: currentTheme.colors.text,
								}}
							>
								<Package size={20} className="opacity-70" />
								<span className="text-xs font-medium">
									Estoque
								</span>
							</button>
							<button
								onClick={() => navigate('../tools')}
								className="p-3 rounded-lg border hover:bg-black/5 transition-colors text-center flex flex-col items-center gap-2"
								style={{
									borderColor: currentTheme.colors.border,
									color: currentTheme.colors.text,
								}}
							>
								<Hammer size={20} className="opacity-70" />
								<span className="text-xs font-medium">
									Ferramentas
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ObraOverview;
