
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { RentedEquipment } from '../types';

export const rentedEquipmentService = {
  getAll: async (siteId: string): Promise<RentedEquipment[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'rented_equipment');
    const q = query(ref, orderBy("entryDate", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        entryDate: data.entryDate?.toDate() || new Date(),
        exitDate: data.exitDate?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as RentedEquipment;
    });
  },

  registerEntry: async (siteId: string, data: Omit<RentedEquipment, 'id' | 'updatedAt' | 'siteId' | 'status' | 'exitDate' | 'exitPhotos'>) => {
    const ref = collection(db, 'construction_sites', siteId, 'rented_equipment');
    await addDoc(ref, {
      ...data,
      siteId,
      status: 'ACTIVE',
      updatedAt: serverTimestamp(),
      // entryDate já vem do objeto data, ou pode ser forçado aqui se quiser
    });
  },

  registerExit: async (siteId: string, equipmentId: string, exitData: { exitDate: Date, exitPhotos: string[] }) => {
    const ref = doc(db, 'construction_sites', siteId, 'rented_equipment', equipmentId);
    await updateDoc(ref, {
      status: 'RETURNED',
      exitDate: exitData.exitDate,
      exitPhotos: exitData.exitPhotos,
      updatedAt: serverTimestamp()
    });
  }
};
