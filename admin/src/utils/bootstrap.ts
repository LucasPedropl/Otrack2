// Helper script to run in browser console to bootstrap the first admin
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const bootstrapAdmin = async (email: string) => {
	try {
		await setDoc(doc(db, 'system_admins', email), {
			email,
			role: 'super_admin',
			createdAt: serverTimestamp(),
		});
		console.log(`Admin ${email} created successfully`);
		alert(`Admin ${email} adicionado com sucesso!`);
	} catch (error) {
		console.error('Error creating admin', error);
		alert('Erro ao criar admin. Verifique o console.');
	}
};
