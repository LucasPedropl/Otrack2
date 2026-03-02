import { db, auth } from '../lib/firebase';
import {
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	setPersistence,
	browserLocalPersistence,
	browserSessionPersistence,
	createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
	collection,
	query,
	where,
	getDocs,
	deleteDoc,
} from 'firebase/firestore';
import { User } from '../types';

const ADMIN_EMAILS = [
	'pedrolucasmota2005@gmail.com',
	'pedro@gmail.com',
	'teste@gmail.com',
];
const STORAGE_KEY = 'obralog_user';

export const authService = {
	syncUser: async (firebaseUser: FirebaseUser): Promise<User> => {
		const userDocRef = doc(db, 'users', firebaseUser.uid);
		const userDocSnap = await getDoc(userDocRef);

		// 1. Usuário já existe com UID correto
		if (userDocSnap.exists()) {
			const data = userDocSnap.data();
			return {
				id: firebaseUser.uid,
				name: data.name,
				email: data.email,
				role: data.role || 'operario',
				companyId: data.companyId,
				profileId: data.profileId,
				needsPasswordChange: data.needsPasswordChange,
				createdAt: data.createdAt?.toDate() || new Date(),
			};
		}

		// 2. Primeiro acesso: Usuário pré-cadastrado (Invite)
		// Busca por email na coleção 'users' (criado pelo Admin Panel)
		const q = query(
			collection(db, 'users'),
			where('email', '==', firebaseUser.email),
		);
		const querySnap = await getDocs(q);

		if (!querySnap.empty) {
			const inviteDoc = querySnap.docs[0];
			const inviteData = inviteDoc.data();

			// Prepara dados para o novo documento com UID
			const newUser: User = {
				id: firebaseUser.uid,
				name: inviteData.name || firebaseUser.displayName || 'Usuário',
				email: firebaseUser.email!,
				role: inviteData.role || 'operario',
				companyId: inviteData.companyId, // IMPORTANTE: Vincula à empresa
				profileId: inviteData.profileId || '',
				needsPasswordChange: inviteData.needsPasswordChange ?? true, // Força troca se não definido
				createdAt: new Date(),
			};

			// Salva no doc com UID
			await setDoc(userDocRef, {
				...newUser,
				createdAt: serverTimestamp(),
				tempPassword: null, // Limpa a senha temporária no novo doc
			});

			// Remove o documento de convite antigo para evitar duplicatas e limpar senha exposta
			await deleteDoc(inviteDoc.ref);

			return newUser;
		}

		// 3. Não autorizado
		await signOut(auth);
		throw new Error(
			'Acesso negado. Seu email não foi convidado para nenhuma empresa.',
		);
	},

	loginWithEmail: async (
		email: string,
		password: string,
		rememberMe: boolean = true,
	): Promise<User> => {
		try {
			// 1. Tenta login normal via Firebase Auth
			const persistence = rememberMe
				? browserLocalPersistence
				: browserSessionPersistence;
			await setPersistence(auth, persistence);

			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password,
			);
			const user = await authService.syncUser(userCredential.user);

			const storage = rememberMe ? localStorage : sessionStorage;
			storage.setItem(STORAGE_KEY, JSON.stringify(user));

			return user;
		} catch (err: any) {
			// console.error("Login Error:", err.code);

			// 2. Fallback: Verifica se é um usuário convidado (Invite) com senha temporária
			if (
				err.code === 'auth/user-not-found' ||
				err.code === 'auth/invalid-credential' ||
				err.code === 'auth/wrong-password'
			) {
				try {
					// Busca convite com essa senha
					// Nota: Firestore Rules permite leitura pública de 'users' para isso funcionar
					const q = query(
						collection(db, 'users'),
						where('email', '==', email),
						where('tempPassword', '==', password), // Validação direta no banco
					);
					const querySnap = await getDocs(q);

					if (!querySnap.empty) {
						// Senha correta e convite existe!
						// Tenta criar o usuário no Auth
						try {
							const userCredential =
								await createUserWithEmailAndPassword(
									auth,
									email,
									password,
								);

							// syncUser vai migrar o documento de convite para o UID
							const user = await authService.syncUser(
								userCredential.user,
							);

							const storage = rememberMe
								? localStorage
								: sessionStorage;
							storage.setItem(STORAGE_KEY, JSON.stringify(user));
							return user;
						} catch (createErr: any) {
							if (
								createErr.code === 'auth/email-already-in-use'
							) {
								// Caso de inconsistência (Auth existe, mas senha não batia, porém tempPass bate)
								throw new Error(
									'Sua conta já existe (Auth). Use "Esqueci minha senha" para recuperar o acesso.',
								);
							}
							throw createErr;
						}
					}
				} catch (provErr: any) {
					if (provErr.message?.includes('Sua conta já existe'))
						throw provErr;
					console.error('Erro ao verificar convite:', provErr);
				}
			}

			if (
				err.message ===
				'Sua conta já existe (Auth). Use "Esqueci minha senha" para recuperar o acesso.'
			) {
				throw err;
			}

			if (
				err.message?.includes('permissions') ||
				err.code === 'permission-denied'
			) {
				throw new Error(
					'Erro de permissão no servidor. Contate o administrador.',
				);
			}

			throw new Error('E-mail ou senha incorretos.');
		}
	},

	loginWithGoogle: async (rememberMe: boolean = true): Promise<User> => {
		// Configura persistência do Firebase
		await setPersistence(
			auth,
			rememberMe ? browserLocalPersistence : browserSessionPersistence,
		);

		const provider = new GoogleAuthProvider();
		const userCredential = await signInWithPopup(auth, provider);
		const user = await authService.syncUser(userCredential.user);

		const storage = rememberMe ? localStorage : sessionStorage;
		storage.setItem(STORAGE_KEY, JSON.stringify(user));
		if (rememberMe) sessionStorage.removeItem(STORAGE_KEY);
		else localStorage.removeItem(STORAGE_KEY);

		return user;
	},

	logout: async () => {
		try {
			await signOut(auth);
		} catch (e) {}
		localStorage.removeItem(STORAGE_KEY);
		sessionStorage.removeItem(STORAGE_KEY);
	},

	getCurrentUser: (): User | null => {
		// Tenta SessionStorage primeiro (sessão temporária), depois LocalStorage
		const stored =
			sessionStorage.getItem(STORAGE_KEY) ||
			localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
		return null;
	},

	// Verifica se o usuário armazenado no storage ainda existe no banco
	verifyUserExists: async (userId: string): Promise<boolean> => {
		try {
			const docRef = doc(db, 'users', userId);
			const snapshot = await getDoc(docRef);
			return snapshot.exists();
		} catch (e) {
			console.error('Erro ao verificar existência do usuário:', e);
			return false;
		}
	},

	onAuthStateChanged: (callback: (user: User | null) => void) => {
		return onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				// Usuário autenticado pelo Firebase
				try {
					const user = await authService.syncUser(firebaseUser);
					// Atualiza o storage existente com dados novos, mantendo o tipo de persistência escolhido no login
					const isSession = !!sessionStorage.getItem(STORAGE_KEY);
					const storage = isSession ? sessionStorage : localStorage;
					storage.setItem(STORAGE_KEY, JSON.stringify(user));

					callback(user);
				} catch (error) {
					callback(null);
				}
			} else {
				// Força logout se não houver sessão no Firebase Auth
				// Isso garante que usuários legados sejam deslogados e forçados a passar pela migração no login
				const storedUser = authService.getCurrentUser();
				if (storedUser) {
					await authService.logout();
				}
				callback(null);
			}
		});
	},
};
