export interface Company {
	id: string;
	name: string;
	createdAt: any; // Firestore Timestamp
}

export interface SystemUser {
	id: string;
	name: string;
	email: string;
	companyId: string;
	role: 'admin' | 'user';
	tempPassword?: string;
	needsPasswordChange?: boolean;
	createdAt?: any;
}
