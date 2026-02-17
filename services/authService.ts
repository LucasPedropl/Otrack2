import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { User } from '../types';

const COLLECTION_NAME = 'users';
const ADMIN_EMAIL = 'pedrolucasmota2005@gmail.com';

export const authService = {
  /**
   * Logs in a user by email.
   * STRICT WHITELIST IMPLEMENTATION:
   * Only users already present in the 'users' collection can log in.
   * Auto-registration is disabled for everyone except the hardcoded ADMIN_EMAIL.
   */
  login: async (email: string): Promise<User> => {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User exists in whitelist -> Allow Access
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        profileId: data.profileId,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } else {
      // User does NOT exist.
      
      // Fallback: If it is the Super Admin, allow creation (Bootstrapping)
      // Otherwise: BLOCK ACCESS.
      if (email === ADMIN_EMAIL) {
        const newUser: Omit<User, 'id'> = {
          email,
          role: 'admin',
          createdAt: new Date(),
        };

        const docRef = await addDoc(usersRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        return {
          id: docRef.id,
          ...newUser,
        };
      } else {
        // WHITELIST BLOCK
        throw new Error("Acesso negado. Seu email não está cadastrado no sistema.");
      }
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