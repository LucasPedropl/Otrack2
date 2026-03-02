import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
	apiKey: 'AIzaSyADMq2uQp7nLwGWCw807zOYq-8e3xFnUSE',
	authDomain: 'estoque-4a453.firebaseapp.com',
	projectId: 'estoque-4a453',
	storageBucket: 'estoque-4a453.firebasestorage.app',
	messagingSenderId: '1068944169403',
	appId: '1:1068944169403:web:45df31221fd05564238c9e',
	measurementId: 'G-YMH2MTLFCZ',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
