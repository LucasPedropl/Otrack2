import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { AccessProfile } from '../types';

const COLLECTION_NAME = 'access_profiles';

export const accessProfileService = {
  getAll: async (): Promise<AccessProfile[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);

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
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, profile);
  },

  delete: async (id: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};