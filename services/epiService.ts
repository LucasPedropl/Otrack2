import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { EPIWithdrawal } from '../types';
import { siteInventoryService } from './siteInventoryService';

export const epiService = {
  // Registra a retirada de EPI e atualiza o estoque
  registerWithdrawal: async (siteId: string, withdrawal: Omit<EPIWithdrawal, 'id'>) => {
    // 1. Atualizar o estoque (reduzir quantidade)
    await siteInventoryService.registerMovement(siteId, withdrawal.itemId, {
      type: 'OUT',
      quantity: withdrawal.quantity,
      reason: 'Retirada de EPI',
      userId: withdrawal.collaboratorId,
      userName: withdrawal.collaboratorName,
      itemName: withdrawal.itemName
    });

    // 2. Registrar na coleção de retiradas de EPI para histórico fácil
    const ref = collection(db, 'construction_sites', siteId, 'epi_withdrawals');
    await addDoc(ref, {
      ...withdrawal,
      date: withdrawal.date || serverTimestamp()
    });
  },

  // Busca histórico de retiradas de EPI da obra
  getWithdrawals: async (siteId: string): Promise<EPIWithdrawal[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'epi_withdrawals');
    const q = query(ref, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date()
      } as EPIWithdrawal;
    });
  },

  // Busca histórico por colaborador
  getWithdrawalsByCollaborator: async (siteId: string, collaboratorId: string): Promise<EPIWithdrawal[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'epi_withdrawals');
    const q = query(ref, where('collaboratorId', '==', collaboratorId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date()
      } as EPIWithdrawal;
    });
  }
};
