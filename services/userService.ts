import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("email"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Usuário',
            email: data.email,
            role: data.role,
            createdAt: data.createdAt?.toDate() || new Date()
        } as User;
    });
  },

  add: async (user: Omit<User, 'id' | 'createdAt'>) => {
    const ref = collection(db, COLLECTION_NAME);
    await addDoc(ref, {
      ...user,
      createdAt: serverTimestamp()
    });
  },

  update: async (id: string, user: Partial<User>) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, user);
  },

  delete: async (id: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};