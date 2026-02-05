import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { User } from '../types';

const COLLECTION_NAME = 'users';
const ADMIN_EMAIL = 'pedrolucasmota2005@gmail.com';

export const authService = {
  /**
   * Logs in a user by email.
   * Note: In a production app, use Firebase Auth. Here we are using a custom implementation
   * based on the prompt's request to just store/check email in Firestore.
   */
  login: async (email: string): Promise<User> => {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User exists
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } else {
      // User does not exist. 
      // If it is the predefined admin email, we create it automatically.
      // Otherwise, we might restrict access or create as a guest (Logic depends on business rules).
      // Here, we permit the admin creation.
      
      let role: User['role'] = 'operario';
      if (email === ADMIN_EMAIL) {
        role = 'admin';
      }

      // Check if we allow registration (For now, yes, create the user)
      const newUser: Omit<User, 'id'> = {
        email,
        role,
        createdAt: new Date(), // Local date, serverTimestamp used in doc
      };

      const docRef = await addDoc(usersRef, {
        ...newUser,
        createdAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...newUser,
      };
    }
  },

  logout: () => {
    localStorage.removeItem('obralog_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('obralog_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }
};