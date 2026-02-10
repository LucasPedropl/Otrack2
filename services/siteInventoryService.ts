import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { SiteInventoryItem, StockMovement } from '../types';

export const siteInventoryService = {
  // Pega o estoque de uma obra específica (Subcoleção)
  getSiteInventory: async (siteId: string): Promise<SiteInventoryItem[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'inventory');
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        siteId: siteId,
        originalItemId: data.originalItemId,
        name: data.name,
        unit: data.unit,
        category: data.category,
        quantity: data.quantity ?? 0,
        averagePrice: data.averagePrice ?? 0,
        minThreshold: data.minThreshold ?? 0,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as SiteInventoryItem;
    });
  },

  // Adiciona um item ao estoque da obra
  addItem: async (siteId: string, item: Omit<SiteInventoryItem, 'id' | 'updatedAt' | 'siteId'>) => {
    const ref = collection(db, 'construction_sites', siteId, 'inventory');
    await addDoc(ref, {
      ...item,
      siteId: siteId, // Redundância útil
      updatedAt: serverTimestamp()
    });
  },

  // Atualiza quantidade ou configurações do item na obra
  updateItem: async (siteId: string, itemId: string, data: Partial<SiteInventoryItem>) => {
    const ref = doc(db, 'construction_sites', siteId, 'inventory', itemId);
    const dataToUpdate = { ...data, updatedAt: serverTimestamp() };
    delete dataToUpdate.id; // Garante que não sobrescrevemos o ID no corpo do doc
    
    await updateDoc(ref, dataToUpdate);
  },

  // Remove item do estoque da obra
  deleteItem: async (siteId: string, itemId: string) => {
    const ref = doc(db, 'construction_sites', siteId, 'inventory', itemId);
    await deleteDoc(ref);
  },

  // --- MOVIMENTAÇÕES ---

  // Registra entrada ou saída e atualiza o saldo (Transação Atômica)
  registerMovement: async (siteId: string, itemId: string, movement: Omit<StockMovement, 'id' | 'date'>) => {
    const itemRef = doc(db, 'construction_sites', siteId, 'inventory', itemId);
    const movementsRef = collection(db, 'construction_sites', siteId, 'inventory', itemId, 'movements');

    await runTransaction(db, async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists()) {
        throw new Error("Item não encontrado!");
      }

      const currentQty = itemDoc.data().quantity || 0;
      let newQty = currentQty;

      if (movement.type === 'IN') {
        newQty += movement.quantity;
      } else {
        newQty -= movement.quantity;
      }

      if (newQty < 0) {
        throw new Error("Estoque insuficiente para esta saída.");
      }

      // 1. Atualiza quantidade no item pai
      transaction.update(itemRef, { 
        quantity: newQty,
        updatedAt: serverTimestamp()
      });

      // 2. Cria o documento de histórico na subcoleção
      const newMovementDoc = doc(movementsRef);
      transaction.set(newMovementDoc, {
        ...movement,
        date: serverTimestamp()
      });
    });
  },

  // Busca histórico de movimentações de um item
  getItemHistory: async (siteId: string, itemId: string): Promise<StockMovement[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'inventory', itemId, 'movements');
    const q = query(ref, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        userId: data.userId,
        userName: data.userName,
        date: data.date?.toDate() || new Date()
      } as StockMovement;
    });
  }
};