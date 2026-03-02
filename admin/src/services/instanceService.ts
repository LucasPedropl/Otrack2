import { db } from '../lib/firebase';
import {
	collection,
	addDoc,
	setDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp,
	query,
	orderBy,
} from 'firebase/firestore';
import type { Instance } from '../types';

const COLLECTION_NAME = 'authorized_instances';

export const instanceService = {
	async getAll(): Promise<Instance[]> {
		const q = query(
			collection(db, COLLECTION_NAME),
			orderBy('createdAt', 'desc'),
		);
		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate() || new Date(),
				}) as Instance,
		);
	},

	async create(email: string, name: string): Promise<string> {
		// Usar o email como ID do documento para facilitar validação nas regras do Firestore
		// (firestore.rules pode checar exists(/databases/$(database)/documents/authorized_instances/$(request.auth.token.email)))
		const docRef = doc(db, COLLECTION_NAME, email);
		await setDoc(docRef, {
			email,
			name,
			status: 'active',
			createdAt: serverTimestamp(),
		});
		return email;
	},

	async toggleStatus(
		id: string,
		currentStatus: 'active' | 'inactive',
	): Promise<void> {
		const docRef = doc(db, COLLECTION_NAME, id);
		await updateDoc(docRef, {
			status: currentStatus === 'active' ? 'inactive' : 'active',
		});
	},

	async delete(id: string): Promise<void> {
		const docRef = doc(db, COLLECTION_NAME, id);
		await deleteDoc(docRef);
	},
};
