import { auth, db } from '../lib/firebase';
import {
	type User,
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signInWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper function to check if user is an admin
export const checkIsAdmin = async (email: string | null): Promise<boolean> => {
	if (!email) return false;
	try {
		const adminDocRef = doc(db, 'system_admins', email);
		const adminDoc = await getDoc(adminDocRef);
		return adminDoc.exists();
	} catch (error) {
		console.error('Error checking admin status', error);
		// If we catch a permission error here, it means we can't read the admins collection.
		// This happens if the user is not an admin and rules forbid reading.
		return false;
	}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setLoading(true);
			if (currentUser) {
				setUser(currentUser);
			} else {
				setUser(null);
			}
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		await signInWithPopup(auth, provider);
	};

	const logout = async () => {
		await firebaseSignOut(auth);
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, signInWithGoogle, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
