import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { AccessProfile } from '../types';

const COLLECTION_NAME = 'access_profiles';

const DEFAULT_PROFILES: Omit<AccessProfile, 'id'>[] = [
  { name: 'Administrador', description: 'Acesso total ao sistema', permissions: ['all'], level: 'Alto' },
  { name: 'Almoxarife', description: 'Gerencia estoque e obras', permissions: ['read_inventory', 'write_inventory'], level: 'Médio' },
  { name: 'Operário', description: 'Visualização básica', permissions: ['read_inventory'], level: 'Baixo' },
];

export const accessProfileService = {
  getAll: async (): Promise<AccessProfile[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Retorna mocks se vazio para demonstrar a UI
      return DEFAULT_PROFILES.map((p, i) => ({ id: `default-${i}`, ...p }));
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccessProfile));
  },

  add: async (profile: Omit<AccessProfile, 'id'>) => {
    const ref = collection(db, COLLECTION_NAME);
    await addDoc(ref, profile);
  },

  update: async (id: string, profile: Partial<AccessProfile>) => {
    if (id.startsWith('default-')) throw new Error("Não é possível editar perfis padrão.");
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, profile);
  },

  delete: async (id: string) => {
    if (id.startsWith('default-')) throw new Error("Não é possível excluir perfis padrão.");
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};