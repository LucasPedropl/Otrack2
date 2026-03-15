import { db } from '../lib/firebase';
import {
	collection,
	getDocs,
	getDoc,
	addDoc,
	doc,
	deleteDoc,
	updateDoc,
	query,
	orderBy,
	serverTimestamp,
	where,
	setDoc,
} from 'firebase/firestore';
import { User } from '../types';
import { initializeApp, deleteApp } from 'firebase/app';
import {
	getAuth,
	createUserWithEmailAndPassword,
	signOut,
} from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';
import { authService } from './authService';

const COLLECTION_NAME = 'users';

export const userService = {
	getAll: async (): Promise<User[]> => {
		const companyId = authService.getCurrentUser()?.companyId;
		const ref = collection(db, COLLECTION_NAME);
		let q = query(ref, orderBy('email'));

		if (companyId) {
			q = query(
				ref,
				where('companyId', '==', companyId),
				orderBy('email'),
			);
		}

		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => {
			const data = doc.data();
			let workspaces = data.workspaces || [];
			let activeWs = workspaces.find(
				(w: any) => w.companyId === companyId,
			);

			return {
				id: doc.id,
				name: data.name || 'Usuário',
				email: data.email,
				password: data.password, // Adicionado para persistência na UI
				role: activeWs?.role || data.role,
				companyId: activeWs?.companyId || data.companyId,
				profileId: activeWs?.profileId || data.profileId,
				workspaces: workspaces,
				createdAt: data.createdAt?.toDate() || new Date(),
			} as User;
		});
	},
	getByProfileId: async (profileId: string): Promise<User[]> => {
		const ref = collection(db, COLLECTION_NAME);
		const q = query(ref, where('profileId', '==', profileId));
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name || 'Usuário',
				email: data.email,
				password: data.password, // Adicionado
				role: data.role,
				profileId: data.profileId,
				workspaces: data.workspaces || [],
				createdAt: data.createdAt?.toDate() || new Date(),
			} as User;
		});
	},

	add: async (user: Omit<User, 'id' | 'createdAt'>) => {
		const currentUser = authService.getCurrentUser();
		const companyId = currentUser?.companyId;
		const companyName = currentUser?.companyName || 'Empresa';

		if (!companyId) throw new Error('Empresa não identificada.');

		// 1. Check if user already exists in Firestore by Email
		const usersRef = collection(db, COLLECTION_NAME);
		const q = query(usersRef, where('email', '==', user.email));
		const querySnap = await getDocs(q);

		if (!querySnap.empty) {
			// Usuário já existe no banco geral
			const existingDoc = querySnap.docs[0];
			const existingData = existingDoc.data();
			let workspaces = existingData.workspaces || [];

			// Verifica se já está na mesma empresa
			const alreadyInCompany = workspaces.some(
				(w: any) => w.companyId === companyId,
			);
			if (alreadyInCompany) {
				throw new Error(
					'Este e-mail já está cadastrado nesta empresa.',
				);
			}

			// Não está na empresa, vamos vinculá-lo (sem precisar criar no Auth de novo)
			workspaces.push({
				companyId: companyId,
				companyName: companyName,
				role: user.role || 'operario',
				profileId: user.profileId,
			});

			await updateDoc(existingDoc.ref, {
				workspaces: workspaces,
				allowedCompanyIds: workspaces.map((w: any) => w.companyId),
				// Preserva o fallback legado
				...(existingData.companyId ? {} : { companyId: companyId }),
			});
			return; // Terminamos por aqui
		}

		// 2. Usuário não existe, fluxo normal de criação
		if (!user.password) {
			// Cria apenas como convite (Invite) no Firestore, sem Firebase Auth
			// O usuário deverá logar via Google para "reivindicar" a conta.
			const baseUser = { ...user, companyId: companyId || null };

			const workspaceObj: any = {
				companyId: companyId,
				companyName: companyName,
				role: user.role || 'operario',
			};
			if (user.profileId !== undefined) {
				workspaceObj.profileId = user.profileId;
			}
			baseUser.workspaces = [workspaceObj];

			const payloadToAdd = {
				...baseUser,
				allowedCompanyIds: baseUser.workspaces.map(
					(w: any) => w.companyId,
				),
				createdAt: serverTimestamp(),
			};
			Object.keys(payloadToAdd).forEach(key => {
				if ((payloadToAdd as any)[key] === undefined) delete (payloadToAdd as any)[key];
			});

			await addDoc(collection(db, COLLECTION_NAME), payloadToAdd);
			return;
		}

		// Create user in Firebase Auth using a temporary app instance
		// This prevents logging out the current admin user
		const tempApp = initializeApp(firebaseConfig, 'tempApp');
		const tempAuth = getAuth(tempApp);

		try {
			const userCredential = await createUserWithEmailAndPassword(
				tempAuth,
				user.email,
				user.password,
			);
			const uid = userCredential.user.uid;

			// 3. Create user document in Firestore with the same UID
			const ref = doc(db, COLLECTION_NAME, uid);
			const baseUser = { ...user, companyId: companyId || null };

			// Inicia o array de Workspaces
			const workspaceObj: any = {
				companyId: companyId,
				companyName: companyName,
				role: user.role || 'operario',
			};
			if (user.profileId !== undefined) {
				workspaceObj.profileId = user.profileId;
			}
			baseUser.workspaces = [workspaceObj];

			const payloadToSet = {
				...baseUser,
				allowedCompanyIds: baseUser.workspaces.map(
					(w: any) => w.companyId,
				),
				createdAt: serverTimestamp(),
			};
			Object.keys(payloadToSet).forEach(key => {
				if ((payloadToSet as any)[key] === undefined) delete (payloadToSet as any)[key];
			});

			await setDoc(ref, payloadToSet);

			// Sign out from temp auth just in case
			await signOut(tempAuth);
		} catch (error: any) {
			console.error('Error creating user:', error);
			if (error.code === 'auth/email-already-in-use') {
				throw new Error(
					'Este e-mail já está em uso por outra conta no sistema global.',
				);
			}
			throw new Error(error.message || 'Erro ao criar usuário.');
		} finally {
			// Cleanup temp app
			try {
				await deleteApp(tempApp);
			} catch (e) {}
		}
	},

	update: async (id: string, user: Partial<User>) => {
		const ref = doc(db, COLLECTION_NAME, id);

		// Precisamos garantir que atualizamos o workspace correto ao editar um usuário
		const currentCompanyId = authService.getCurrentUser()?.companyId;
		const docSnap = await getDoc(ref);

		if (docSnap.exists() && currentCompanyId) {
			const existingData = docSnap.data();
			let workspaces = existingData.workspaces || [];

			// Verifica se já tem o workspace, se sim atualiza, senão cria
			const wsIndex = workspaces.findIndex(
				(w: any) => w.companyId === currentCompanyId,
			);

			if (wsIndex >= 0) {
				if (user.role !== undefined)
					workspaces[wsIndex].role = user.role;
				if (user.profileId !== undefined)
					workspaces[wsIndex].profileId = user.profileId;
				// update fallback local too
				user.workspaces = workspaces;
				user.allowedCompanyIds = workspaces.map(
					(w: any) => w.companyId,
				);
			}
		}

		await updateDoc(ref, user);
	},

	delete: async (id: string) => {
		const ref = doc(db, COLLECTION_NAME, id);
		const currentCompanyId = authService.getCurrentUser()?.companyId;

		const docSnap = await getDoc(ref);
		if (!docSnap.exists()) return;

		const data = docSnap.data();
		const workspaces = data.workspaces || [];

		// Se o usuário pertence a mais de uma empresa (ou se estamos tentando remover a empresa atual)
		if (workspaces.length > 1 && currentCompanyId) {
			const updatedWorkspaces = workspaces.filter(
				(w: any) => w.companyId !== currentCompanyId,
			);

			// Se removeu do array, atualiza em vez de deletar o documento todo
			if (updatedWorkspaces.length < workspaces.length) {
				await updateDoc(ref, {
					workspaces: updatedWorkspaces,
					allowedCompanyIds: updatedWorkspaces.map(
						(w: any) => w.companyId,
					),
					// Limpa a companyId principal SE ela for a empresa atual que está sendo removida
					...(data.companyId === currentCompanyId
						? { companyId: null }
						: {}),
				});
				return;
			}
		}

		// Se tem apenas 1 workspace (ou não tem currentCompanyId), exclui permanentemente
		await deleteDoc(ref);
	},
};
