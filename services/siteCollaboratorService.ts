import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Collaborator } from './collaboratorService';

export interface SiteCollaborator {
  id?: string;
  siteId: string;
  originalCollaboratorId: string;
  name: string;
  role?: string; // Cargo/Função
  admissionDate: Date;
  isActive: boolean;
}

export const siteCollaboratorService = {
  // Adiciona um colaborador global à obra
  addCollaboratorToSite: async (siteId: string, globalCollaborator: Collaborator) => {
    // Verifica se já existe
    const q = query(
      collection(db, 'construction_sites', siteId, 'collaborators'),
      where('originalCollaboratorId', '==', globalCollaborator.id)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error("Colaborador já cadastrado nesta obra.");
    }

    const ref = collection(db, 'construction_sites', siteId, 'collaborators');
    await addDoc(ref, {
      siteId,
      originalCollaboratorId: globalCollaborator.id,
      name: globalCollaborator.nome,
      role: 'Operário', // Default, pode ser melhorado
      admissionDate: new Date(),
      isActive: true
    });
  },

  // Busca colaboradores da obra
  getSiteCollaborators: async (siteId: string): Promise<SiteCollaborator[]> => {
    const ref = collection(db, 'construction_sites', siteId, 'collaborators');
    const snapshot = await getDocs(ref);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        admissionDate: data.admissionDate?.toDate() || new Date()
      } as SiteCollaborator;
    });
  },

  // Remove colaborador da obra
  removeCollaboratorFromSite: async (siteId: string, siteCollaboratorId: string) => {
    const ref = doc(db, 'construction_sites', siteId, 'collaborators', siteCollaboratorId);
    await deleteDoc(ref);
  }
};
