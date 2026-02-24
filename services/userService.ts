import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp, where, setDoc } from 'firebase/firestore';
import { User } from '../types';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase';

const COLLECTION_NAME = 'users';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy("email"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Usuário',
            email: data.email,
            password: data.password, // Adicionado para persistência na UI
            role: data.role,
            profileId: data.profileId,
            createdAt: data.createdAt?.toDate() || new Date()
        } as User;
    });
  },

  getByProfileId: async (profileId: string): Promise<User[]> => {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, where("profileId", "==", profileId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Usuário',
            email: data.email,
            password: data.password, // Adicionado
            role: data.role,
            profileId: data.profileId,
            createdAt: data.createdAt?.toDate() || new Date()
        } as User;
    });
  },

  add: async (user: Omit<User, 'id' | 'createdAt'>) => {
    if (!user.password) throw new Error("A senha é obrigatória para criar um usuário.");
    // 1. Create user in Firebase Auth using a temporary app instance
    // This prevents logging out the current admin user
    const tempApp = initializeApp(firebaseConfig, 'tempApp');
    const tempAuth = getAuth(tempApp);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, user.email, user.password);
        const uid = userCredential.user.uid;
        
        // 2. Create user document in Firestore with the same UID
        const ref = doc(db, COLLECTION_NAME, uid);
        await setDoc(ref, {
          ...user,
          createdAt: serverTimestamp()
        });
        
        // Sign out from temp auth just in case
        await signOut(tempAuth);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    } finally {
        // Cleanup temp app
        try {
            await deleteApp(tempApp); 
        } catch (e) {}
    }
  },

  update: async (id: string, user: Partial<User>) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, user);
  },

  delete: async (id: string) => {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  }
};
