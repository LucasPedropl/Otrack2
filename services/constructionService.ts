import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ConstructionSite } from '../types';

const COLLECTION_NAME = 'construction_sites';

export const constructionService = {
  getAll: async (): Promise<ConstructionSite[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt?.toDate() || new Date()
      } as ConstructionSite;
    });
  },

  getById: async (id: string): Promise<ConstructionSite | null> => {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name,
        createdAt: data.createdAt?.toDate() || new Date()
      } as ConstructionSite;
    }
    return null;
  },

  add: async (name: string) => {
    const ref = collection(db, COLLECTION_NAME);
    await addDoc(ref, {
      name,
      createdAt: serverTimestamp()
    });
  },

  update: async (id: string, name: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, {
      name,
      updatedAt: serverTimestamp()
    });
  },

  delete: async (id: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};