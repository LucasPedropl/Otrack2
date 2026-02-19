
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc, runTransaction, writeBatch } from 'firebase/firestore';
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
        isTool: data.isTool, // Pode ser undefined, true ou false
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as SiteInventoryItem;
    });
  },

  // Adiciona um item ao estoque da obra E registra a movimentação inicial
  addItem: async (siteId: string, item: Omit<SiteInventoryItem, 'id' | 'updatedAt' | 'siteId'>) => {
    const batch = writeBatch(db);
    
    // 1. Criar referência do novo item
    const inventoryCollectionRef = collection(db, 'construction_sites', siteId, 'inventory');
    const newItemRef = doc(inventoryCollectionRef);
    
    const timestamp = serverTimestamp();

    batch.set(newItemRef, {
      ...item,
      siteId: siteId, 
      updatedAt: timestamp
    });

    // 2. Se houver quantidade inicial > 0, registrar na subcoleção movements
    if (item.quantity > 0) {
        const movementsCollectionRef = collection(db, 'construction_sites', siteId, 'inventory', newItemRef.id, 'movements');
        const newMovementRef = doc(movementsCollectionRef);
        
        batch.set(newMovementRef, {
            type: 'IN',
            quantity: item.quantity,
            reason: 'Cadastro Inicial',
            date: timestamp,
            userId: 'SYSTEM', 
            userName: 'Sistema'
        });
    }

    await batch.commit();
  },

  // Atualiza quantidade ou configurações do item na obra
  updateItem: async (siteId: string, itemId: string, data: Partial<SiteInventoryItem>) => {
    const ref = doc(db, 'construction_sites', siteId, 'inventory', itemId);
    const dataToUpdate = { ...data, updatedAt: serverTimestamp() };
    delete dataToUpdate.id; 
    
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
  },

  // Busca TODAS as movimentações da obra (Agregador)
  getAllSiteMovements: async (siteId: string): Promise<StockMovement[]> => {
    const items = await siteInventoryService.getSiteInventory(siteId);
    
    const promises = items.map(async (item) => {
        const history = await siteInventoryService.getItemHistory(siteId, item.id!);
        return history.map(h => ({
            ...h,
            itemName: item.name,
            itemUnit: item.unit
        }));
    });

    const results = await Promise.all(promises);
    
    const allMovements = results.flat().sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return allMovements;
  }
};
