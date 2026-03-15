import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface ForcePasswordChangeProps {
	user: User;
	onSuccess: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({
	user,
	onSuccess,
}) => {
	const [newName, setNewName] = useState(user.name || '');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName.trim()) {
			setError('O nome é obrigatório.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('As senhas não conferem.');
			return;
		}
		if (newPassword.length < 6) {
			setError('A senha deve ter pelo menos 6 caracteres.');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const currentUser = auth.currentUser;
			if (!currentUser) throw new Error('Usuário não autenticado.');

			// 1. Atualiza senha no Authentication
			await updatePassword(currentUser, newPassword);

			// 2. Atualiza flag e nome no Firestore
			const userRef = doc(db, 'users', user.id || currentUser.uid);
			await updateDoc(userRef, {
				name: newName.trim(),
				needsPasswordChange: false,
				tempPassword: null, // Garante limpeza caso tenha sobrado
			});

			// 3. Atualiza estado local
			const updatedUser = await authService.syncUser(currentUser);
			localStorage.setItem('obralog_user', JSON.stringify(updatedUser));

			onSuccess();
		} catch (err: any) {
			console.error(err);
			setError(err.message || 'Erro ao atualizar senha.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
				<h2 className="text-xl font-bold text-gray-800 mb-2">
					Alteração de Senha Necessária
				</h2>
				<p className="text-gray-600 mb-6 text-sm">
					Por segurança, você deve definir uma nova senha pessoal
					antes de continuar.
				</p>

				{error && (
					<div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Seu Nome
						</label>
						<input
							type="text"
							className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							required
							placeholder="Como devemos chamar você?"
						/>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Nova Senha
						</label>
						<input
							type="password"
							className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							minLength={6}
						/>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Confirmar Nova Senha
						</label>
						<input
							type="password"
							className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={6}
						/>
					</div>

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() =>
								authService
									.logout()
									.then(() => window.location.reload())
							}
							className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
							disabled={loading}
						>
							Cancelar (Sair)
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
						>
							{loading ? 'Atualizando...' : 'Definir Senha'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
