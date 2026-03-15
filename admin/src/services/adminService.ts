import { db } from '../lib/firebase';
import {
	collection,
	getDocs,
	addDoc,
	deleteDoc,
	updateDoc,
	doc,
	query,
	where,
	serverTimestamp,
} from 'firebase/firestore';
import type { Company, SystemUser } from '../types';

const COMPANIES_COLLECTION = 'companies';
const USERS_COLLECTION = 'users';

export const adminService = {
	// --- COMPANHIA ---
	getCompanies: async (): Promise<Company[]> => {
		const q = query(collection(db, COMPANIES_COLLECTION));
		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() }) as Company,
		);
	},

	createCompany: async (name: string): Promise<string> => {
		const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), {
			name,
			createdAt: serverTimestamp(),
		});
		return docRef.id;
	},

	updateCompany: async (id: string, name: string) => {
		const ref = doc(db, COMPANIES_COLLECTION, id);
		await updateDoc(ref, { name });
	},

	deleteCompany: async (id: string) => {
		await deleteDoc(doc(db, COMPANIES_COLLECTION, id));
		// TODO: Deletar usuários da empresa também?
		// Por segurança (nested), seria ideal, mas vou deixar simples por enquanto.
	},

	// --- USUÁRIOS ADMIN ---
	getCompanyAdmins: async (companyId: string): Promise<SystemUser[]> => {
		const q = query(
			collection(db, USERS_COLLECTION),
			where('companyId', '==', companyId),
			where('role', '==', 'admin'),
		);
		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() }) as SystemUser,
		);
	},

	createCompanyAdmin: async (
		companyId: string,
		userData: { email: string; tempPassword?: string },
	) => {
		const newUserData: any = {
			email: userData.email,
			name: '', // Nome inicialmente vazio, admin define depois
			companyId: companyId,
			role: 'admin',
			needsPasswordChange: true,
		};
		if (userData.tempPassword) {
			newUserData.tempPassword = userData.tempPassword;
		}

		// check uniqueness of email first?
		// for now just add
		const userRef = await addDoc(collection(db, USERS_COLLECTION), {
			...newUserData,
			createdAt: serverTimestamp(),
		});
		return userRef.id;
	},

	updateUser: async (id: string, data: Partial<SystemUser>) => {
		const ref = doc(db, USERS_COLLECTION, id);
		await updateDoc(ref, data);
	},

	deleteUser: async (id: string) => {
		await deleteDoc(doc(db, USERS_COLLECTION, id));
	},
};
