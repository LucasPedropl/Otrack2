export interface Company {
	id: string;
	name: string;
	createdAt: any; // Firestore Timestamp
}

export interface Instance {
	id: string;
	domain: string;
	dbPrefix: string;
	active: boolean;
	createdAt: any;
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
