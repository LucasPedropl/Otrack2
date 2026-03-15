import { db, storage } from '../lib/firebase';
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	query,
	orderBy,
	getDoc,
	where,
} from 'firebase/firestore';
import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
} from 'firebase/storage';
import { authService } from './authService';

export interface Collaborator {
	id?: string;
	empresa: string;
	nome: string;
	cpf?: string;
	rg?: string;
	dtNascimento?: string;
	telefone: string;
	celular?: string;
	email?: string;
	endereco?: {
		cep: string;
		logradouro: string;
		numero: string;
		bairro: string;
		complemento?: string;
		uf: string;
		cidade: string;
	};
	fotoUrl?: string;
	anexos?: { name: string; url: string; path: string }[];
	createdAt?: any;
	updatedAt?: any;
	companyId?: string;
}

const COLLECTION_NAME = 'colaboradores';

export const collaboratorService = {
	async getAll() {
		const companyId = authService.getCurrentUser()?.companyId;
		let q = query(collection(db, COLLECTION_NAME), orderBy('nome'));

		if (companyId) {
			q = query(
				collection(db, COLLECTION_NAME),
				where('companyId', '==', companyId),
				orderBy('nome'),
			);
		}

		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() }) as Collaborator,
		);
	},

	async getById(id: string) {
		const docRef = doc(db, COLLECTION_NAME, id);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			return { id: docSnap.id, ...docSnap.data() } as Collaborator;
		}
		return null;
	},

	async create(collaborator: Omit<Collaborator, 'id'>) {
		const companyId = authService.getCurrentUser()?.companyId;
		const docRef = await addDoc(collection(db, COLLECTION_NAME), {
			...collaborator,
			companyId: companyId || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return docRef.id;
	},

	async update(id: string, collaborator: Partial<Collaborator>) {
		const docRef = doc(db, COLLECTION_NAME, id);
		await updateDoc(docRef, {
			...collaborator,
			updatedAt: new Date(),
		});
	},

	async delete(id: string) {
		const docRef = doc(db, COLLECTION_NAME, id);
		await deleteDoc(docRef);
	},

	async uploadFile(file: File, path: string) {
		const storageRef = ref(storage, path);
		const snapshot = await uploadBytes(storageRef, file);
		return await getDownloadURL(snapshot.ref);
	},

	async deleteFile(path: string) {
		const storageRef = ref(storage, path);
		await deleteObject(storageRef);
	},
};
