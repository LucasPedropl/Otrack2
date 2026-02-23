import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Collaborator } from './collaboratorService';

export interface SiteCollaborator {
  id?: string;
  siteId: string;
  originalCollaboratorId: string;
  name: string;
  role?: string;
  admissionDate: Date;
  isActive: boolean;
}

export const siteCollaboratorService = {
  addCollaboratorToSite: async (siteId: string, globalCollaborator: Collaborator) => {
    const ref = collection(db, 'construction_sites', siteId, 'collaborators');
    const q = query(
      ref,
      where('originalCollaboratorId', '==', globalCollaborator.id)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error("Colaborador já cadastrado nesta obra.");
    }

    await addDoc(ref, {
      siteId,
      originalCollaboratorId: globalCollaborator.id,
      name: globalCollaborator.nome,
      role: 'Operário',
      admissionDate: new Date(),
      isActive: true
    });
  },

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

  removeCollaboratorFromSite: async (siteId: string, siteCollaboratorId: string) => {
    const ref = doc(db, 'construction_sites', siteId, 'collaborators', siteCollaboratorId);
    await deleteDoc(ref);
  }
};
