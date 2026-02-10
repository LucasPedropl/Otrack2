import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { AccessProfile } from '../types';

const COLLECTION_NAME = 'access_profiles';

const DEFAULT_PROFILES: Omit<AccessProfile, 'id'>[] = [
  { 
    id: 'default-admin', // ID fixo para o admin
    name: 'Administrador', 
    permissions: ['admin:full'],
    allowedSites: [] // Empty implies all
  } as any, // Cast as any allows passing the ID in the mock list
];

export const accessProfileService = {
  getAll: async (): Promise<AccessProfile[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Retorna apenas o Admin padrão se vazio
      return DEFAULT_PROFILES.map((p) => ({ ...p }));
    }
    
    // Garante que o Admin padrão sempre apareça na lista (caso não esteja no banco ainda em dev)
    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccessProfile));

    const adminExists = profiles.some(p => p.id === 'default-admin' || p.permissions.includes('admin:full'));
    if (!adminExists) {
        profiles.unshift(DEFAULT_PROFILES[0] as AccessProfile);
    }

    return profiles;
  },

  add: async (profile: Omit<AccessProfile, 'id'>) => {
    const ref = collection(db, COLLECTION_NAME);
    await addDoc(ref, profile);
  },

  update: async (id: string, profile: Partial<AccessProfile>) => {
    if (id === 'default-admin') throw new Error("O perfil Administrador não pode ser modificado.");
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, profile);
  },

  delete: async (id: string) => {
    if (id === 'default-admin') throw new Error("O perfil Administrador não pode ser excluído.");
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};