import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { InventoryItem } from '../types';

const COLLECTION_NAME = 'inventory';

export const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        name: data.name,
        quantity: data.quantity ?? 0,
        unit: data.unit,
        category: data.category,
        costType: data.costType,
        unitValue: data.unitValue,
        stockControl: data.stockControl ?? true,
        minThreshold: data.minThreshold ?? 0,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as InventoryItem;
    });
  },

  add: async (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const ref = collection(db, COLLECTION_NAME);
    await addDoc(ref, {
      ...item,
      updatedAt: serverTimestamp()
    });
  },

  update: async (id: string, item: Partial<InventoryItem>) => {
    const ref = doc(db, COLLECTION_NAME, id);
    // Remove undefined fields
    const dataToUpdate = Object.entries(item).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    await updateDoc(ref, {
      ...dataToUpdate,
      updatedAt: serverTimestamp()
    });
  },

  delete: async (id: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};