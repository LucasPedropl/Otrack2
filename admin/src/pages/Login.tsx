import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Login() {
	const { signInWithGoogle, user, logout: signOut } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = useState('');
	const [checking, setChecking] = useState(false);

	useEffect(() => {
		if (user) {
			checkAdminAccess(user.email);
		}
	}, [user]);

	const checkAdminAccess = async (email: string | null) => {
		if (!email) return;
		setChecking(true);
		try {
			// Check if user is in system_admins collection
			const adminDoc = await getDoc(doc(db, 'system_admins', email));

			if (adminDoc.exists()) {
				navigate('/');
			} else {
				// --- BOOTSTRAP (Temporary) ---
				// Uncomment the lines below to auto-register the VERY FIRST user as admin, then comment again.
				// OR better: handle this manually in Firestore Console.
				// For development convenience, we can allow the user to click a 'bootstrap' button if needed,
				// or just display a message.

				// Since the user asked specifically about their "main email",
				// we can warn them they are not authorized.
				setError(
					'Acesso negado. Este email não tem permissão de administrador.',
				);
				// Do NOT logout immediately, so the user can see the bootstrap button if configured
				// await logoutAndClear();
			}
		} catch (err) {
			console.error(err);
			setError('Erro ao verificar permissões.');
		} finally {
			setChecking(false);
		}
	};

	const logoutAndClear = async () => {
		try {
			await signOut(); // Ensure signOut is from AuthContext
			navigate('/login');
		} catch (err) {
			console.error('Logout failed', err);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			setError('');
			await signInWithGoogle();
		} catch (err: any) {
			setError('Falha ao fazer login com Google.');
			console.error(err);
		}
	};

	/* eslint-disable-next-line no-unused-vars
	const handleBootstrap = async () => {
		if (!user?.email) return;
		try {
			await setDoc(doc(db, 'system_admins', user.email), {
				email: user.email,
				createdAt: serverTimestamp(),
				createdBy: 'bootstrap',
			});
			checkAdminAccess(user.email);
		} catch (err) {
			console.error(err);
			setError(
				'Erro ao criar admin inicial. Verifique as regras do Firestore.',
			);
		}
	}; */

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-gray-900">
						Admin Login
					</h1>
					<p className="text-gray-500 mt-2">
						Acesso restrito a administradores
					</p>
				</div>

				{error && (
					<div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex flex-col gap-2 text-sm">
						<div className="flex items-center gap-2">
							<AlertCircle size={16} />
							{error}
						</div>
						{user && (
							<div className="flex flex-col gap-2 mt-2 pl-6 border-t border-red-100 pt-2">
								<p className="text-xs text-gray-700">
									Logado como: <strong>{user.email}</strong>
								</p>
								<button
									onClick={logoutAndClear}
									className="text-xs text-red-600 underline hover:text-red-800 text-left"
								>
									Sair e tentar outra conta
								</button>
							</div>
						)}
					</div>
				)}

				{checking ? (
					<div className="text-center py-4 text-gray-500">
						Verificando permissões...
					</div>
				) : (
					<div className="space-y-4">
						<button
							onClick={handleGoogleLogin}
							className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
						>
							<img
								src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
								className="w-5 h-5"
								alt="Google"
							/>
							Entrar com Google
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
