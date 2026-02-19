
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { ToolLoan } from '../types';

export const toolService = {
  // Busca empréstimos ativos de uma obra
  getActiveLoans: async (siteId: string): Promise<ToolLoan[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'tool_loans');
    const q = query(ref, where('status', '==', 'OPEN'), orderBy("loanDate", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      loanDate: doc.data().loanDate?.toDate() || new Date(),
      returnDate: doc.data().returnDate?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ToolLoan));
  },

  // Busca histórico completo
  getLoanHistory: async (siteId: string): Promise<ToolLoan[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'tool_loans');
    const q = query(ref, orderBy("updatedAt", "desc"), orderBy("loanDate", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      loanDate: doc.data().loanDate?.toDate() || new Date(),
      returnDate: doc.data().returnDate?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ToolLoan));
  },

  // Criar empréstimo
  createLoan: async (siteId: string, loan: Omit<ToolLoan, 'id' | 'updatedAt' | 'siteId' | 'status'>) => {
    const ref = collection(db, 'construction_sites', siteId, 'tool_loans');
    await addDoc(ref, {
      ...loan,
      itemOrigin: loan.itemOrigin || 'INVENTORY', 
      siteId,
      status: 'OPEN',
      updatedAt: serverTimestamp(),
      loanDate: loan.loanDate || serverTimestamp()
    });
  },

  // Devolver ferramenta
  returnLoan: async (siteId: string, loanId: string, data?: { returnDate: Date, notes?: string }) => {
    const ref = doc(db, 'construction_sites', siteId, 'tool_loans', loanId);
    
    const updateData: any = {
        status: 'RETURNED',
        updatedAt: serverTimestamp()
    };

    if (data) {
        updateData.returnDate = data.returnDate;
        if (data.notes) {
            updateData.returnNotes = data.notes; // Notes specific to the return action
        }
    } else {
        updateData.returnDate = serverTimestamp();
    }

    await updateDoc(ref, updateData);
  }
};
