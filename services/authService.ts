
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
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { User } from '../types';

const ADMIN_EMAILS = ['pedrolucasmota2005@gmail.com', 'pedro@gmail.com', 'teste@gmail.com'];

export const authService = {
  syncUser: async (firebaseUser: FirebaseUser): Promise<User> => {
    // Primeiro tenta buscar pelo UID (caso de login Google)
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let userDocSnap = await getDoc(userDocRef);

    // Se não achou pelo UID, tenta buscar pelo E-mail (caso de usuário criado manual que logou com Google depois)
    if (!userDocSnap.exists()) {
        const q = query(collection(db, 'users'), where("email", "==", firebaseUser.email));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
            const data = querySnap.docs[0].data();
            return {
                id: querySnap.docs[0].id,
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                profileId: data.profileId,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        }
    }

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      return {
        id: firebaseUser.uid,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        profileId: data.profileId,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } else {
      // Auto-registro para admins conhecidos
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
        await signOut(auth);
        throw new Error("Acesso negado. Seu email não está cadastrado no sistema.");
      }
    }
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    try {
      // 1. Prioridade: Login Gerenciado via Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        const user = {
          id: userDoc.id,
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          profileId: data.profileId,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
        
        localStorage.setItem('obralog_user', JSON.stringify(user));
        return user;
      }

      // 2. Fallback: Firebase Auth padrão
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = await authService.syncUser(userCredential.user);
      localStorage.setItem('obralog_user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      console.error("Login error:", err);
      // Se o erro for de permissão, é porque a regra do Firestore barrou a consulta inicial
      if (err.message?.includes("permissions") || err.code === 'permission-denied') {
        throw new Error("Erro de permissão no servidor. Contate o administrador.");
      }
      throw new Error("E-mail ou senha incorretos.");
    }
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = await authService.syncUser(userCredential.user);
    localStorage.setItem('obralog_user', JSON.stringify(user));
    return user;
  },

  logout: async () => {
    try {
        await signOut(auth);
    } catch (e) {}
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
        // Importante: Se não há usuário Firebase, mantemos o do LocalStorage (Login Gerenciado)
        const stored = authService.getCurrentUser();
        callback(stored);
      }
    });
  }
};
