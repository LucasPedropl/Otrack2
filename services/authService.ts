import { db, auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, serverTimestamp, query, where, getDocs, addDoc } from 'firebase/firestore';
import { User } from '../types';

const ADMIN_EMAIL = 'pedrolucasmota2005@gmail.com';

// Helper to ensure Firestore user document exists
const ensureFirestoreUser = async (firebaseUser: any) => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      name: data.name,
      email: data.email,
      role: data.role,
      profileId: data.profileId,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } else {
    // User not in Firestore
    if (firebaseUser.email === ADMIN_EMAIL) {
      // BOOTSTRAP ADMIN
      let adminProfileId = '';
      const profilesRef = collection(db, 'access_profiles');
      const q = query(profilesRef, where("name", "==", "Super Admin"));
      const profileSnap = await getDocs(q);

      if (!profileSnap.empty) {
        adminProfileId = profileSnap.docs[0].id;
      } else {
        const newProfileRef = await addDoc(profilesRef, {
          name: "Super Admin",
          permissions: ['admin:full'],
          createdAt: serverTimestamp()
        });
        adminProfileId = newProfileRef.id;
      }

      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Admin',
        email: firebaseUser.email,
        role: 'admin',
        profileId: adminProfileId,
        createdAt: new Date(),
      };

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });

      return newUser;
    } else {
      // Check if user was pre-registered by Admin (found by email)
      const usersRef = collection(db, 'users');
      const qEmail = query(usersRef, where("email", "==", firebaseUser.email));
      const emailSnap = await getDocs(qEmail);

      if (!emailSnap.empty) {
        // Migrate pre-registered user to Auth UID
        const oldDoc = emailSnap.docs[0];
        const oldData = oldDoc.data();

        await setDoc(userRef, {
          ...oldData,
          id: firebaseUser.uid
        });

        // Optional: delete old doc
        // await deleteDoc(oldDoc.ref);

        return {
          id: firebaseUser.uid,
          ...oldData
        } as User;
      }

      throw new Error("Acesso negado. Peça ao administrador para cadastrar seu email no sistema.");
    }
  }
};

export const authService = {
  // Legacy stub
  login: async (email: string) => { throw new Error("Use Login Google ou Email/Senha"); },

  loginWithGoogle: async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await ensureFirestoreUser(result.user);
    } catch (error: any) {
      console.error("Login Google error", error);
      throw error;
    }
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return await ensureFirestoreUser(result.user);
    } catch (error: any) {
      console.error("Login Email error", error);
      throw error;
    }
  },

  registerWithEmail: async (email: string, password: string, name: string): Promise<User> => {
    // Only used for initial bootstrapping or explicit registration if enabled
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Add display name
        // await updateProfile(result.user, { displayName: name }); 
        // Note: updateProfile needs import. Skipping for brevity, handle in ensureFirestoreUser fallback logic
        
        return await ensureFirestoreUser({ ...result.user, displayName: name });
    } catch (error: any) {
        console.error("Register Error", error);
        throw error;
    }
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
  }
};