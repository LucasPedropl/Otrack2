import { db, auth } from '../lib/firebase';
import {
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	type User as FirebaseUser,
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
	disableNetwork,
	enableNetwork,
} from 'firebase/firestore';
import type { User, UserWorkspace } from '../types';

const STORAGE_KEY = 'obralog_user';

export const authService = {
	syncUser: async (firebaseUser: FirebaseUser): Promise<User> => {
		const userDocRef = doc(db, 'users', firebaseUser.uid);
		const userDocSnap = await getDoc(userDocRef);

		// 1. Usuário já existe com UID correto
		if (userDocSnap.exists()) {
			const data = userDocSnap.data();

			// Lida com retrocompatibilidade: converte formato antigo para o novo array de workspaces
			let workspaces: UserWorkspace[] = data.workspaces || [];
			if (workspaces.length === 0 && data.companyId) {
				const fallbackWorkspace: any = {
					companyId: data.companyId,
					companyName: 'Minha Empresa', // Fallback genérico para legados
					role: data.role || 'operario',
				};
				if (data.profileId !== undefined) {
					fallbackWorkspace.profileId = data.profileId;
				}
				workspaces.push(fallbackWorkspace);
			}

			// Prepara o objeto base do usuário
			const user: User = {
				id: firebaseUser.uid,
				name: data.name,
				email: data.email,
				workspaces: workspaces,
				allowedCompanyIds: workspaces.map(
					(w: UserWorkspace) => w.companyId,
				),
				needsPasswordChange: data.needsPasswordChange,
				createdAt: data.createdAt?.toDate() || new Date(),
			};

			// Garante que o doc do banco tem a lista espelhada atualizada para as rules do firestore
			if (
				!data.allowedCompanyIds ||
				data.allowedCompanyIds.length !== workspaces.length
			) {
				setDoc(
					userDocRef,
					{ ...data, allowedCompanyIds: user.allowedCompanyIds },
					{ merge: true },
				).catch(console.error);
			}

			// Mantém o workspace atual se ele já estivesse salvo no storage local (durante um sync de page reload)
			const existingSession = authService.getCurrentUser();
			if (
				existingSession &&
				existingSession.activeWorkspaceId &&
				workspaces.some(
					(w) => w.companyId === existingSession.activeWorkspaceId,
				)
			) {
				return authService.applyActiveWorkspace(
					user,
					existingSession.activeWorkspaceId,
				);
			}

			// Se só tem 1 workspace, já define ele como ativo por padrão
			if (workspaces.length === 1) {
				return authService.applyActiveWorkspace(
					user,
					workspaces[0].companyId,
				);
			}

			return user;
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

			// Converte para o novo formato de Workspaces
			let workspaces = inviteData.workspaces || [];
			if (workspaces.length === 0 && inviteData.companyId) {
				const fallbackWorkspace: any = {
					companyId: inviteData.companyId,
					companyName: 'Empresa',
					role: inviteData.role || 'operario',
				};
				if (inviteData.profileId !== undefined) {
					fallbackWorkspace.profileId = inviteData.profileId;
				}
				workspaces.push(fallbackWorkspace);
			}

			// Prepara dados para o novo documento com UID
			const newUser: User = {
				id: firebaseUser.uid,
				name: inviteData.name || firebaseUser.displayName || 'Usuário',
				email: firebaseUser.email!,
				workspaces: workspaces,
				needsPasswordChange: inviteData.needsPasswordChange ?? true, // Força troca se não definido
				createdAt: new Date(),
			};

			// Salva no doc com UID
			const finalData = {
				...newUser,
				allowedCompanyIds: workspaces.map(
					(w: UserWorkspace) => w.companyId,
				),
				createdAt: serverTimestamp(),
				tempPassword: null, // Limpa a senha temporária no novo doc
			};

			// Remove eventuais campos undefined antes de salvar no Firestore
			Object.keys(finalData).forEach(key => {
				if ((finalData as any)[key] === undefined) {
					delete (finalData as any)[key];
				}
			});

			await setDoc(userDocRef, finalData);

			// Remove o documento de convite antigo para evitar duplicatas e limpar senha exposta
			await deleteDoc(inviteDoc.ref);

			if (newUser.workspaces.length === 1) {
				return authService.applyActiveWorkspace(
					newUser,
					newUser.workspaces[0].companyId,
				);
			}

			return newUser;
		}

		// 3. Não autorizado (SaaS Fechado)
		await signOut(auth);
		throw new Error(
			'Acesso negado. Seu e-mail não foi convidado por nenhuma empresa.',
		);
	},

	applyActiveWorkspace: (user: User, companyId: string): User => {
		const workspace = user.workspaces.find(
			(w) => w.companyId === companyId,
		);
		if (!workspace) return user;

		return {
			...user,
			activeWorkspaceId: workspace.companyId,
			companyId: workspace.companyId, // Para retrocompatibilidade com services antigos
			companyName: workspace.companyName,
			role: workspace.role,
			profileId: workspace.profileId,
		};
	},

	switchWorkspace: (companyId: string) => {
		const user = authService.getCurrentUser();
		if (!user) return;

		const updatedUser = authService.applyActiveWorkspace(user, companyId);

		// Descobre qual storage estava usando (local ou session) para manter
		const isSession = !!sessionStorage.getItem(STORAGE_KEY);
		const storage = isSession ? sessionStorage : localStorage;
		storage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

		// Força um reload para garantir que todos os Services e Contexts busquem do novo companyId
		window.location.href = '/#/app/dashboard';
		window.location.reload();
	},

	loginWithEmail: async (
		email: string,
		password: string,
		rememberMe: boolean = true,
	): Promise<User> => {
		try {
			await enableNetwork(db); // Reativa Firestore caso tenha sido desligado no logout
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
									'Sua conta já existe. Acesse via Google ou recupere sua senha.',
								);
							}
							throw createErr;
						}
					}
				} catch (provErr: any) {
					if (provErr.message?.includes('Sua conta já existe'))
						throw provErr;
					console.error('Erro ao verificar convite:', provErr);
					throw provErr; // Rethrow to show the actual error to the user (e.g. permission-denied)
				}
			}

			if (
				err.message ===
				'Sua conta já existe. Acesse via Google ou recupere sua senha.'
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
		try {
			await enableNetwork(db); // Reativa Firestore
			// Configura persistência do Firebase
			await setPersistence(
				auth,
				rememberMe
					? browserLocalPersistence
					: browserSessionPersistence,
			);

			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const user = await authService.syncUser(userCredential.user);

			const storage = rememberMe ? localStorage : sessionStorage;
			storage.setItem(STORAGE_KEY, JSON.stringify(user));
			if (rememberMe) sessionStorage.removeItem(STORAGE_KEY);
			else localStorage.removeItem(STORAGE_KEY);

			return user;
		} catch (error: any) {
			console.error('Erro detalhado no login com Google:', error);
			if (error.message && error.message.includes('Acesso negado')) {
				throw error; // Preserva o erro original sobre convite
			}
			throw new Error('Erro ao fazer login com Google.');
		}
	},

	logout: async () => {
		try {
			// Tenta desligar rede para evitar requisições pendentes após perder auth
			await disableNetwork(db);
			await signOut(auth);
		} catch (e) {
			console.error('Logout error', e);
		}
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
