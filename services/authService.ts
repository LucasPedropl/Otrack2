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
	createUserWithEmailAndPassword
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
	deleteDoc
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
		// Primeiro tenta buscar pelo UID (caso de login Google)
		const userDocRef = doc(db, 'users', firebaseUser.uid);
		let userDocSnap = await getDoc(userDocRef);

		// Se não achou pelo UID, tenta buscar pelo E-mail (caso de usuário criado manual que logou com Google depois)
		if (!userDocSnap.exists()) {
			const q = query(
				collection(db, 'users'),
				where('email', '==', firebaseUser.email),
			);
			const querySnap = await getDocs(q);
			if (!querySnap.empty) {
				const data = querySnap.docs[0].data();
				return {
					id: querySnap.docs[0].id,
					name: data.name,
					email: data.email,
					password: data.password,
					role: data.role,
					profileId: data.profileId,
					createdAt: data.createdAt?.toDate() || new Date(),
				};
			}
		}

		if (userDocSnap.exists()) {
			const data = userDocSnap.data();
			return {
				id: firebaseUser.uid,
				name: data.name,
				email: data.email,
				password: data.password,
				role: data.role,
				profileId: data.profileId,
				createdAt: data.createdAt?.toDate() || new Date(),
			};
		} else {
			// Auto-registro para admins conhecidos
			if (ADMIN_EMAILS.includes(firebaseUser.email || '')) {
				const newUser: Omit<User, 'id'> = {
					name: firebaseUser.displayName || 'Administrador',
					email: firebaseUser.email!,
					role: 'admin',
					createdAt: new Date(),
				};

				await setDoc(userDocRef, {
					...newUser,
					createdAt: serverTimestamp(),
				});

				return {
					id: firebaseUser.uid,
					...newUser,
				};
			} else {
				await signOut(auth);
				throw new Error(
					'Acesso negado. Seu email não está cadastrado no sistema.',
				);
			}
		}
	},

	loginWithEmail: async (
		email: string,
		password: string,
		rememberMe: boolean = true,
	): Promise<User> => {
		try {
			// 1. Tenta login normal via Firebase Auth
			await setPersistence(
				auth,
				rememberMe
					? browserLocalPersistence
					: browserSessionPersistence,
			);
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
			// 2. Fallback: Migração de usuário legado (criado apenas no Firestore)
			if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
				const usersRef = collection(db, 'users');
				const q = query(
					usersRef,
					where('email', '==', email),
					where('password', '==', password),
				);
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					const oldDoc = querySnapshot.docs[0];
					const userData = oldDoc.data();

					try {
						// Cria o usuário no Firebase Auth
						const userCredential = await createUserWithEmailAndPassword(auth, email, password);
						const newUid = userCredential.user.uid;

						// Move o documento para o novo UID
						await setDoc(doc(db, 'users', newUid), userData);
						await deleteDoc(oldDoc.ref);

						const user = await authService.syncUser(userCredential.user);
						const storage = rememberMe ? localStorage : sessionStorage;
						storage.setItem(STORAGE_KEY, JSON.stringify(user));

						return user;
					} catch (migrationErr: any) {
						console.error("Erro na migração:", migrationErr);
						await signOut(auth); // Ensure we don't leave a half-migrated state
						throw new Error("Erro ao atualizar conta legada. Contate o suporte.");
					}
				}
			}

			console.error('Login error:', err);
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
