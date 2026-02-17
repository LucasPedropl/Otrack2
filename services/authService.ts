import { db, auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { User } from '../types';

const ADMIN_EMAILS = ['pedrolucasmota2005@gmail.com', 'pedro@gmail.com'];

export const authService = {
  /**
   * Syncs the Firebase User with our Firestore 'users' collection.
   * If it's a bootstrap admin and doesn't exist, create it.
   */
  syncUser: async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return {
        id: firebaseUser.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        profileId: data.profileId,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } else {
      // If user doesn't exist in Firestore, check if it's a bootstrap admin
      if (ADMIN_EMAILS.includes(firebaseUser.email || '')) {
        const newUser: Omit<User, 'id'> = {
          name: firebaseUser.displayName || 'Administrador',
          email: firebaseUser.email!,
          role: 'admin',
          createdAt: new Date(),
        };

        await setDoc(userDocRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        return {
          id: firebaseUser.uid,
          ...newUser,
        };
      } else {
        // Not an admin and doesn't exist -> Blocked by whitelist logic
        await signOut(auth);
        throw new Error("Acesso negado. Seu email não está cadastrado no sistema.");
      }
    }
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await authService.syncUser(userCredential.user);
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return await authService.syncUser(userCredential.user);
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('obralog_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('obralog_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await authService.syncUser(firebaseUser);
          localStorage.setItem('obralog_user', JSON.stringify(user));
          callback(user);
        } catch (error) {
          callback(null);
        }
      } else {
        localStorage.removeItem('obralog_user');
        callback(null);
      }
    });
  }
};