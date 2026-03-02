import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Building2, UserPlus, Users } from 'lucide-react';
import type { Company, SystemUser } from '../types';
import { adminService } from '../services/adminService';

export default function Dashboard() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);

	// Estado para formulário de NOVA EMPRESA
	const [newCompanyName, setNewCompanyName] = useState('');

	// Estado para gerenciar qual empresa está expandida/selecionada
	const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
		null,
	);
	const [companyUsers, setCompanyUsers] = useState<SystemUser[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);

	// Estado para formulário de NOVO ADMIN (dentro da empresa selecionada)
	const [newAdminEmail, setNewAdminEmail] = useState('');
	const [newAdminTempPassword, setNewAdminTempPassword] = useState('');

	useEffect(() => {
		loadCompanies();
	}, []);

	// Se mudar a empresa selecionada, carrega seus usuários
	useEffect(() => {
		if (selectedCompanyId) {
			loadCompanyUsers(selectedCompanyId);
		} else {
			setCompanyUsers([]);
		}
	}, [selectedCompanyId]);

	const loadCompanies = async () => {
		setLoading(true);
		try {
			const data = await adminService.getCompanies();
			setCompanies(data);
		} catch (error) {
			console.error('Erro ao buscar empresas:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadCompanyUsers = async (companyId: string) => {
		setLoadingUsers(true);
		try {
			const users = await adminService.getCompanyAdmins(companyId);
			setCompanyUsers(users);
		} catch (error) {
			console.error('Erro ao buscar admins da empresa:', error);
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleCreateCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCompanyName.trim()) return;

		try {
			await adminService.createCompany(newCompanyName);
			setNewCompanyName('');
			loadCompanies();
		} catch (error) {
			console.error('Erro ao criar empresa:', error);
			alert('Erro ao criar empresa.');
		}
	};

	const handleDeleteCompany = async (id: string) => {
		if (!window.confirm('Tem certeza? Isso pode deixar usuários órfãos.'))
			return;
		try {
			await adminService.deleteCompany(id);
			if (selectedCompanyId === id) setSelectedCompanyId(null);
			loadCompanies();
		} catch (error) {
			console.error('Erro ao deletar empresa:', error);
		}
	};

	const handleCreateAdmin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!selectedCompanyId ||
			!newAdminEmail.trim() ||
			!newAdminTempPassword.trim()
		)
			return;

		try {
			await adminService.createCompanyAdmin(selectedCompanyId, {
				email: newAdminEmail,
				tempPassword: newAdminTempPassword,
			});
			setNewAdminEmail('');
			setNewAdminTempPassword('');
			loadCompanyUsers(selectedCompanyId);
		} catch (error) {
			console.error('Erro ao criar admin:', error);
			alert('Erro ao criar admin. Verifique se o email é válido.');
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (!window.confirm('Tem certeza que deseja remover este admin?'))
			return;
		try {
			await adminService.deleteUser(userId);
			if (selectedCompanyId) loadCompanyUsers(selectedCompanyId);
		} catch (error) {
			console.error('Erro ao remover usuário:', error);
		}
	};

	const toggleCompanySelection = (id: string) => {
		setSelectedCompanyId((prev) => (prev === id ? null : id));
	};

	if (loading) {
		return (
			<div className="p-8 text-center text-gray-500">
				Carregando empresas...
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Gerenciamento de Empresas
				</h1>
				<p className="text-gray-600">
					Gerencie as empresas (tenants) e seus administradores
					iniciais.
				</p>
			</div>

			{/* Formulário de Criação de Empresa */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
				<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<Building2 size={20} />
					Nova Empresa
				</h2>
				<form onSubmit={handleCreateCompany} className="flex gap-4">
					<input
						type="text"
						placeholder="Nome da Empresa"
						value={newCompanyName}
						onChange={(e) => setNewCompanyName(e.target.value)}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
					/>
					<button
						type="submit"
						disabled={!newCompanyName.trim()}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
					>
						<Plus size={20} />
						Criar Empresa
					</button>
				</form>
			</div>

			{/* Lista de Empresas */}
			<div className="flex flex-col gap-4">
				{companies.length === 0 ? (
					<div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
						<Building2
							size={48}
							className="mx-auto text-gray-400 mb-4"
						/>
						<p className="text-gray-500">
							Nenhuma empresa cadastrada.
						</p>
					</div>
				) : (
					companies.map((company) => (
						<div
							key={company.id}
							className={`bg-white rounded-lg border transition-all overflow-hidden ${
								selectedCompanyId === company.id
									? 'border-blue-500 shadow-md ring-1 ring-blue-500'
									: 'border-gray-200 shadow-sm hover:border-blue-300'
							}`}
						>
							{/* Header do Card */}
							<div className="p-6 flex items-center justify-between bg-white relative z-10">
								<div
									className="flex items-center gap-4 cursor-pointer flex-1"
									onClick={() =>
										toggleCompanySelection(company.id)
									}
								>
									<div
										className={`p-3 rounded-full transition-colors ${selectedCompanyId === company.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
									>
										<Building2 size={24} />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900">
											{company.name}
										</h3>
										<p className="text-xs text-gray-400 font-mono mt-0.5">
											ID: {company.id}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<button
										onClick={() =>
											toggleCompanySelection(company.id)
										}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
											selectedCompanyId === company.id
												? 'bg-blue-50 text-blue-700 border-blue-200'
												: 'text-gray-600 hover:bg-gray-50 border-gray-200'
										}`}
									>
										{selectedCompanyId === company.id
											? 'Fechar Detalhes'
											: 'Gerenciar Admins'}
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteCompany(company.id);
										}}
										className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
										title="Excluir Empresa"
									>
										<Trash2 size={20} />
									</button>
								</div>
							</div>

							{/* Corpo Expansível */}
							{selectedCompanyId === company.id && (
								<div className="border-t border-gray-200 bg-gray-50/50 p-6 animate-in slide-in-from-top-2 duration-300">
									<div className="flex items-center gap-2 mb-6 text-gray-700 font-semibold border-b pb-2">
										<Users size={18} />
										Administradores da Empresa
									</div>

									{/* Form Admin */}
									<div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
										<h5 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
											<UserPlus
												size={16}
												className="text-green-600"
											/>
											Adicionar Novo Administrador
										</h5>
										<form
											onSubmit={handleCreateAdmin}
											className="flex flex-col sm:flex-row gap-4 items-end"
										>
											<div className="flex-1 w-full">
												<label className="block text-xs font-medium text-gray-500 mb-1">
													E-mail de Acesso
												</label>
												<input
													type="email"
													required
													placeholder="admin@empresa.com"
													value={newAdminEmail}
													onChange={(e) =>
														setNewAdminEmail(
															e.target.value,
														)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm"
												/>
											</div>
											<div className="w-full sm:w-64">
												<label className="block text-xs font-medium text-gray-500 mb-1">
													Senha Temporária
												</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
														<Key size={14} />
													</div>
													<input
														type="text"
														required
														placeholder="Ex: 123456"
														value={
															newAdminTempPassword
														}
														onChange={(e) =>
															setNewAdminTempPassword(
																e.target.value,
															)
														}
														className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm font-mono"
													/>
												</div>
											</div>
											<button
												type="submit"
												className="w-full sm:w-auto bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 text-sm font-medium whitespace-nowrap transition-colors shadow-sm"
											>
												Cadastrar Admin
											</button>
										</form>
									</div>

									{/* Lista de Usuários */}
									{loadingUsers ? (
										<div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
											<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
											Carregando administradores...
										</div>
									) : companyUsers.length === 0 ? (
										<div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
											<UserPlus
												size={32}
												className="mx-auto mb-2 opacity-50"
											/>
											Nenhum administrador cadastrado
											ainda.
										</div>
									) : (
										<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
													<tr>
														<th
															scope="col"
															className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
														>
															Usuário
														</th>
														<th
															scope="col"
															className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
														>
															Acesso
														</th>
														<th
															scope="col"
															className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
														>
															Status
														</th>
														<th
															scope="col"
															className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
														>
															Ações
														</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{companyUsers.map(
														(user) => (
															<tr
																key={user.id}
																className="hover:bg-gray-50 transition-colors"
															>
																<td className="px-6 py-4 whitespace-nowrap">
																	<div className="flex items-center">
																		<div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
																			{user.email
																				.substring(
																					0,
																					2,
																				)
																				.toUpperCase()}
																		</div>
																		<div className="ml-4">
																			<div className="text-sm font-medium text-gray-900">
																				{
																					user.email
																				}
																			</div>
																			<div className="text-xs text-gray-500">
																				{
																					user.role
																				}
																			</div>
																		</div>
																	</div>
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	{user.tempPassword ? (
																		<div className="flex flex-col">
																			<span className="text-xs text-gray-500 mb-1">
																				Senha
																				Temp:
																			</span>
																			<code className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-xs font-mono">
																				{
																					user.tempPassword
																				}
																			</code>
																		</div>
																	) : (
																		<span className="text-xs text-green-600 font-medium">
																			Senha
																			definida
																		</span>
																	)}
																</td>
																<td className="px-6 py-4 whitespace-nowrap">
																	{user.needsPasswordChange ? (
																		<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
																			Pendente
																			Troca
																		</span>
																	) : (
																		<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
																			Ativo
																		</span>
																	)}
																</td>
																<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
																	<button
																		onClick={() =>
																			handleDeleteUser(
																				user.id,
																			)
																		}
																		className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
																		title="Remover Admin"
																	>
																		<Trash2
																			size={
																				16
																			}
																		/>
																	</button>
																</td>
															</tr>
														),
													)}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}
