import { db } from '../lib/firebase';
import {
	collection,
	doc,
	setDoc,
	deleteDoc,
	getDocs,
	query,
	serverTimestamp,
} from 'firebase/firestore';

export interface SystemPermission {
	email: string; // ID do documento
	role: 'admin' | 'user'; // Por enquanto simples
	createdAt: any;
	createdBy: string;
	tempPassword?: string; // Opcional, apenas para referência visual se quisermos (não cria conta realAuth)
	companyName: string; // "Instância"
}

// Criar ou Atualizar permissão
export const setPermission = async (
	email: string,
	data: Partial<SystemPermission>,
) => {
	await setDoc(
		doc(db, 'system_permissions', email),
		{
			...data,
			email, // Garantir que o email está no corpo
			updatedAt: serverTimestamp(),
		},
		{ merge: true },
	);
};

// Listar todas permissões
export const getPermissions = async () => {
	const q = query(collection(db, 'system_permissions'));
	const querySnapshot = await getDocs(q);
	return querySnapshot.docs.map((doc) => doc.data() as SystemPermission);
};

// Remover permissão
export const removePermission = async (email: string) => {
	await deleteDoc(doc(db, 'system_permissions', email));
};
