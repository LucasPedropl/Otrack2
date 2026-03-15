import { db } from '../lib/firebase';
import {
	collection,
	getDocs,
	addDoc,
	serverTimestamp,
	query,
	orderBy,
	doc,
	deleteDoc,
	updateDoc,
	getDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import type { ConstructionSite } from '../types';
import { authService } from './authService';

const COLLECTION_NAME = 'construction_sites';

export const constructionService = {
	getAll: async (): Promise<ConstructionSite[]> => {
		const companyId = authService.getCurrentUser()?.companyId;
		const ref = collection(db, COLLECTION_NAME);
		let q = query(ref, orderBy('name'));

		if (companyId) {
			q = query(
				ref,
				where('companyId', '==', companyId),
				orderBy('name'),
			);
		}

		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				companyId: data.companyId,
				createdAt: data.createdAt?.toDate() || new Date(),
			} as ConstructionSite;
		});
	},

	getById: async (id: string): Promise<ConstructionSite | null> => {
		const ref = doc(db, COLLECTION_NAME, id);
		const snap = await getDoc(ref);

		if (snap.exists()) {
			const data = snap.data();
			// Optionally restrict access here if needed, but Firestore rules should handle it
			return {
				id: snap.id,
				name: data.name,
				companyId: data.companyId,
				createdAt: data.createdAt?.toDate() || new Date(),
			} as ConstructionSite;
		}
		return null;
	},

	add: async (name: string) => {
		const companyId = authService.getCurrentUser()?.companyId;
		const ref = collection(db, COLLECTION_NAME);
		await addDoc(ref, {
			name,
			companyId: companyId || null,
			createdAt: serverTimestamp(),
		});
	},

	update: async (id: string, name: string) => {
		const ref = doc(db, COLLECTION_NAME, id);
		await updateDoc(ref, {
			name,
			updatedAt: serverTimestamp(),
		});
	},

	delete: async (id: string) => {
		const ref = doc(db, COLLECTION_NAME, id);

		// Apagando em cascata: Pegamos todas as possíveis subcoleções da obra
		const batch = writeBatch(db);
		batch.delete(ref); // O documento pai

		// Note: Como as queries client-side do Firebase Firestore para deleção em lote exigem
		// carregar os documentos primeiro, e como não estamos rodando uma Cloud Function de root (admin-sdk),
		// o ideal aqui é fazer as queries por subcoleções ativas da obra se não forem massivas.
		// Para Otrack: `inventory`, `tool_loans`, `rented_equipment`, `epi_withdrawals`, `collaborators`

		const collectionsToDelete = [
			'inventory',
			'tool_loans',
			'rented_equipment',
			'epi_withdrawals',
			'collaborators',
		];

		try {
			for (const subcol of collectionsToDelete) {
				const subcolRef = collection(
					db,
					`${COLLECTION_NAME}/${id}/${subcol}`,
				);
				const subcolSnap = await getDocs(subcolRef);
				subcolSnap.forEach((subDoc) => {
					batch.delete(subDoc.ref);
				});
			}

			await batch.commit();
		} catch (error) {
			console.error(
				'Erro deletando partes em cascata da obra, tentando deletar documento pai ao menos.',
				error,
			);
			// Fallback: se houver restrição, deleta o pai.
			await deleteDoc(ref);
		}
	},
};
