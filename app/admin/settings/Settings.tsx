import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { themes } from '../../../lib/themes';
import {
	Check,
	LogOut,
	User as UserIcon,
	Lock,
	Save,
	Loader2,
} from 'lucide-react';
import { Theme } from '../../../types';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { updatePassword, updateProfile } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

const SettingsPage: React.FC = () => {
	const { currentTheme, setTheme } = useTheme();
	const navigate = useNavigate();
	const currentUser = authService.getCurrentUser();

	const [name, setName] = useState(currentUser?.name || '');
	const [email, setEmail] = useState(currentUser?.email || '');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [isLoadingProfile, setIsLoadingProfile] = useState(false);
	const [isLoadingPassword, setIsLoadingPassword] = useState(false);

	const handleLogout = async () => {
		// Primeiro limpa o storage local para que qualquer refresh subsequente não tente validar auth
		localStorage.removeItem('obralog_user');
		sessionStorage.removeItem('obralog_user');

		// Executa logout do Firebase
		await authService.logout();

		// Força navegação completa para limpar qualquer estado de memória
		window.location.href = '/';
	};

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentUser?.id) return;

		setIsLoadingProfile(true);
		try {
			// Atualiza no Firestore
			await userService.update(currentUser.id, { name });

			// Atualiza no Auth (Display Name)
			if (auth.currentUser) {
				await updateProfile(auth.currentUser, { displayName: name });
			}

			// Atualiza no Local Storage (Simulado via reload ou sync)
			// O ideal seria um método no authService para recarregar o user
			alert(
				'Perfil atualizado com sucesso! (Pode ser necessário relogar para ver mudanças em toda a aplicação)',
			);
		} catch (error) {
			console.error(error);
			alert('Erro ao atualizar perfil.');
		} finally {
			setIsLoadingProfile(false);
		}
	};

	const handleUpdatePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			alert('As senhas não coincidem.');
			return;
		}
		if (newPassword.length < 6) {
			alert('A senha deve ter pelo menos 6 caracteres.');
			return;
		}

		setIsLoadingPassword(true);
		try {
			if (auth.currentUser) {
				await updatePassword(auth.currentUser, newPassword);
				alert('Senha alterada com sucesso!');
				setNewPassword('');
				setConfirmPassword('');
			} else {
				alert('Erro de sessão. Tente relogar.');
			}
		} catch (error: any) {
			console.error(error);
			if (error.code === 'auth/requires-recent-login') {
				alert(
					'Por segurança, faça login novamente antes de trocar a senha.',
				);
				handleLogout();
			} else {
				alert('Erro ao alterar senha: ' + error.message);
			}
		} finally {
			setIsLoadingPassword(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-12">
			{/* Profile Settings Section */}
			<section>
				<div className="mb-6">
					<h3
						className="text-lg font-bold"
						style={{ color: currentTheme.colors.text }}
					>
						Meu Perfil
					</h3>
					<p
						className="text-sm"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Gerencie suas informações pessoais e de segurança.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Personal Info */}
					<form
						onSubmit={handleUpdateProfile}
						className="space-y-4 p-6 rounded-xl border"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
						}}
					>
						<div className="flex items-center gap-2 mb-4">
							<UserIcon
								size={20}
								style={{ color: currentTheme.colors.primary }}
							/>
							<h4
								className="font-semibold"
								style={{ color: currentTheme.colors.text }}
							>
								Dados Pessoais
							</h4>
						</div>

						<Input
							label="Nome Completo"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Seu nome"
						/>

						<Input
							label="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled
							placeholder="seu@email.com"
						/>

						<div className="pt-2">
							<Button
								type="submit"
								disabled={isLoadingProfile}
								style={{
									backgroundColor:
										currentTheme.colors.primary,
									color: '#fff',
								}}
							>
								{isLoadingProfile ? (
									<Loader2 className="animate-spin mr-2 h-4 w-4" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								Salvar Alterações
							</Button>
						</div>
					</form>

					{/* Password Change */}
					<form
						onSubmit={handleUpdatePassword}
						className="space-y-4 p-6 rounded-xl border"
						style={{
							backgroundColor: currentTheme.colors.card,
							borderColor: currentTheme.colors.border,
						}}
					>
						<div className="flex items-center gap-2 mb-4">
							<Lock
								size={20}
								style={{ color: currentTheme.colors.primary }}
							/>
							<h4
								className="font-semibold"
								style={{ color: currentTheme.colors.text }}
							>
								Segurança
							</h4>
						</div>

						<Input
							label="Nova Senha"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Digite a nova senha"
						/>

						<Input
							label="Confirmar Nova Senha"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirme a nova senha"
						/>

						<div className="pt-2">
							<Button
								type="submit"
								disabled={isLoadingPassword || !newPassword}
								style={{
									backgroundColor:
										currentTheme.colors.primary,
									color: '#fff',
								}}
							>
								{isLoadingPassword ? (
									<Loader2 className="animate-spin mr-2 h-4 w-4" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								Alterar Senha
							</Button>
						</div>
					</form>
				</div>
			</section>

			{/* Appearance & Theme Section */}
			<section>
				<div className="mb-6">
					<h3
						className="text-lg font-bold"
						style={{ color: currentTheme.colors.text }}
					>
						Aparência & Tema
					</h3>
					<p
						className="text-sm"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Personalize a interface para se adequar ao seu estilo.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{themes.map((theme: Theme) => {
						const isActive = currentTheme.id === theme.id;

						return (
							<button
								key={theme.id}
								onClick={() => setTheme(theme.id)}
								className={`relative group rounded-xl p-1 text-left transition-all border-2`}
								style={{
									backgroundColor: theme.colors.card,
									borderColor: isActive
										? theme.colors.primary
										: theme.colors.border,
								}}
							>
								<div className="p-4 space-y-3">
									<div className="flex justify-between items-center">
										<span
											className="text-sm font-semibold"
											style={{ color: theme.colors.text }}
										>
											{theme.name}
										</span>
										{isActive && (
											<div
												className="rounded-full p-1"
												style={{
													backgroundColor:
														theme.colors.primary,
												}}
											>
												<Check className="h-3 w-3 text-white" />
											</div>
										)}
									</div>

									{/* Visual Preview Bars */}
									<div className="space-y-2">
										{/* Primary Bar */}
										<div
											className="h-2 rounded-full w-3/4"
											style={{
												backgroundColor:
													theme.colors.primary,
											}}
										></div>
										{/* Secondary/Dark Bar */}
										<div className="flex space-x-2">
											<div
												className="h-8 w-8 rounded-lg border border-white/10"
												style={{
													backgroundColor:
														theme.colors.background,
												}}
											></div>
											<div
												className="h-8 w-8 rounded-lg border border-white/10"
												style={{
													backgroundColor:
														theme.colors.primary,
												}}
											></div>
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</section>

			{/* Session Zone */}
			<section>
				<div className="mb-4">
					<h3
						className="text-lg font-bold"
						style={{ color: currentTheme.colors.text }}
					>
						Sessão
					</h3>
					<p
						className="text-sm"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Gerencie seu acesso atual.
					</p>
				</div>

				<button
					onClick={handleLogout}
					className="flex items-center space-x-2 px-6 py-3 rounded-xl border transition-colors hover:bg-red-500/10 hover:border-red-500"
					style={{
						backgroundColor: currentTheme.colors.card,
						borderColor: currentTheme.colors.border,
						color: '#ef4444', // Red-500
					}}
				>
					<LogOut className="h-5 w-5" />
					<span className="font-medium">Sair do Sistema</span>
				</button>
			</section>
		</div>
	);
};

export default SettingsPage;
