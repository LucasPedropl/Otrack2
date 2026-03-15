import React, { useState, useEffect } from 'react';
import {
	Plus,
	Trash2,
	Building2,
	UserPlus,
	Users,
	Copy,
} from 'lucide-react';
import type { Company, SystemUser } from '../types';
import { adminService } from '../services/adminService';
import { useToast } from '../../../contexts/ToastContext';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

export default function Dashboard() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const toast = useToast();

	// Confirm Dialog State
	const [confirmConfig, setConfirmConfig] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
	});

	// Estado para formulário de NOVA EMPRESA
	const [newCompanyName, setNewCompanyName] = useState('');
	const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);

	// Estado para gerenciar qual empresa está expandida/selecionada
	const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
		null,
	);
	const [companyUsers, setCompanyUsers] = useState<SystemUser[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);

	// Estado para formulário de NOVO ADMIN (dentro da empresa selecionada)
	const [newAdminEmail, setNewAdminEmail] = useState('');
	const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

	useEffect(() => {
		loadCompanies(true);
	}, []);

	// Se mudar a empresa selecionada, carrega seus usuários
	useEffect(() => {
		if (selectedCompanyId) {
			loadCompanyUsers(selectedCompanyId, true);
		} else {
			setCompanyUsers([]);
		}
	}, [selectedCompanyId]);

	const loadCompanies = async (showLoader = false) => {
		if (showLoader) setLoading(true);
		try {
			const data = await adminService.getCompanies();
			setCompanies(data);
		} catch (error) {
			console.error('Erro ao buscar empresas:', error);
		} finally {
			if (showLoader) setLoading(false);
		}
	};

	const loadCompanyUsers = async (companyId: string, showLoader = false) => {
		if (showLoader) setLoadingUsers(true);
		try {
			const users = await adminService.getCompanyAdmins(companyId);
			setCompanyUsers(users);
		} catch (error) {
			console.error('Erro ao buscar admins da empresa:', error);
		} finally {
			if (showLoader) setLoadingUsers(false);
		}
	};

	const handleCreateCompany = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCompanyName.trim() || isSubmittingCompany) return;

		setIsSubmittingCompany(true);
		try {
			await adminService.createCompany(newCompanyName);
			toast.success(`Empresa "${newCompanyName}" criada com sucesso!`);
			setNewCompanyName('');
			loadCompanies();
		} catch (error) {
			console.error('Erro ao criar empresa:', error);
			toast.error('Erro ao criar empresa.');
		} finally {
			setIsSubmittingCompany(false);
		}
	};

	const performDeleteCompany = async (id: string) => {
		try {
			await adminService.deleteCompany(id);
			toast.success('Empresa excluída com sucesso.');
			if (selectedCompanyId === id) setSelectedCompanyId(null);
			loadCompanies();
		} catch (error) {
			console.error('Erro ao deletar empresa:', error);
			toast.error('Erro ao excluir empresa.');
		}
	};

	const handleDeleteCompany = (id: string) => {
		setConfirmConfig({
			isOpen: true,
			title: 'Excluir Empresa?',
			message:
				'Tem certeza? Isso pode deixar usuários órfãos em outros painéis. Esta ação não pode ser desfeita.',
			onConfirm: () => performDeleteCompany(id),
		});
	};

	const handleCreateAdmin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCompanyId || !newAdminEmail.trim() || isSubmittingAdmin)
			return;

		setIsSubmittingAdmin(true);

		// Gera uma senha de 8 caracteres para todos (podem usar para login email/senha, ou simplesmente ignorar e usar Google)
		const generatedPass = Math.random().toString(36).substring(2, 10);

		try {
			await adminService.createCompanyAdmin(selectedCompanyId, {
				email: newAdminEmail,
				tempPassword: generatedPass,
			});

			toast.success('Admin cadastrado com sucesso!');
			// Copia a senha gerada (e email) para a área de transferência do admin
			copyCredentials(newAdminEmail, generatedPass);

			setNewAdminEmail('');
			loadCompanyUsers(selectedCompanyId);
		} catch (error) {
			console.error('Erro ao criar admin:', error);
			toast.error('Erro ao criar admin. Verifique se o email é válido.');
		} finally {
			setIsSubmittingAdmin(false);
		}
	};

	const performDeleteUser = async (userId: string) => {
		try {
			await adminService.deleteUser(userId);
			toast.success('Administrador removido com sucesso.');
			if (selectedCompanyId) loadCompanyUsers(selectedCompanyId);
		} catch (error) {
			console.error('Erro ao remover usuário:', error);
			toast.error('Erro ao remover usuário.');
		}
	};

	const handleDeleteUser = (userId: string) => {
		setConfirmConfig({
			isOpen: true,
			title: 'Remover Administrador?',
			message:
				'Tem certeza que deseja remover este admin? O acesso dele será bloqueado.',
			onConfirm: () => performDeleteUser(userId),
		});
	};

	const copyCredentials = (email: string, pass: string | undefined) => {
		const text = pass
			? `Acesso - Geplano Otrack\nEmail: ${email}\nSenha Temp: ${pass}`
			: `Acesso - Geplano Otrack\nEmail: ${email}\nAcesse pelo Google`;
		navigator.clipboard.writeText(text);
		toast.success('Credenciais copiadas para a área de transferência');
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
						disabled={!newCompanyName.trim() || isSubmittingCompany}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
					>
						<Plus size={20} />
						{isSubmittingCompany ? 'Criando...' : 'Criar Empresa'}
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
											<button
												type="submit"
												disabled={isSubmittingAdmin}
												className="w-full sm:w-auto bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap transition-colors shadow-sm"
											>
												{isSubmittingAdmin
													? 'Cadastrando...'
													: 'Cadastrar Admin'}
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
																<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
																	<button
																		onClick={() =>
																			copyCredentials(
																				user.email,
																				user.tempPassword,
																			)
																		}
																		className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
																		title="Copiar Credenciais (E-mail e Senha)"
																	>
																		<Copy
																			size={
																				16
																			}
																		/>
																	</button>
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
			<ConfirmModal
				isOpen={confirmConfig.isOpen}
				title={confirmConfig.title}
				message={confirmConfig.message}
				onConfirm={confirmConfig.onConfirm}
				onCancel={() =>
					setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
				}
			/>
		</div>
	);
}
