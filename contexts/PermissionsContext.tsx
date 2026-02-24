import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { accessProfileService } from '../services/accessProfileService';

interface PermissionsContextType {
	permissions: string[];
	allowedSites: string[];
	allSites: boolean;
	isAdmin: boolean;
	isLoading: boolean;
	hasPermission: (module: string, action: string, siteId?: string) => boolean;
	canAccessAny: (permissionsToCheck: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
	undefined,
);

const SUPER_ADMIN_EMAILS = [
	'pedrolucasmota2005@gmail.com',
	'pedro@gmail.com',
	'teste@gmail.com',
];

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [permissions, setPermissions] = useState<string[]>([]);
	const [allowedSites, setAllowedSites] = useState<string[]>([]);
	const [allSites, setAllSites] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const unsubscribe = authService.onAuthStateChanged(async (user) => {
			setIsLoading(true);

			if (user) {
				if (SUPER_ADMIN_EMAILS.includes(user.email)) {
					setPermissions(['admin:full']);
					setAllowedSites([]);
					setAllSites(true);
					setIsAdmin(true);
					setIsLoading(false);
					return;
				}

				if (user.profileId) {
					try {
						const profile = await accessProfileService.getById(
							user.profileId,
						);
						if (profile) {
							setPermissions(profile.permissions || []);
							setAllowedSites(profile.allowedSites || []);
							setAllSites(profile.allSites ?? false);
							setIsAdmin(
								profile.permissions.includes('admin:full'),
							);
						} else {
							setPermissions([]);
							setAllowedSites([]);
							setAllSites(false);
							setIsAdmin(false);
						}
					} catch (error) {
						console.error('Error loading permissions', error);
						setPermissions([]);
						setAllowedSites([]);
						setAllSites(false);
						setIsAdmin(false);
					}
				} else {
					setPermissions([]);
					setAllowedSites([]);
					setAllSites(false);
					setIsAdmin(false);
				}
			} else {
				setPermissions([]);
				setAllowedSites([]);
				setAllSites(false);
				setIsAdmin(false);
			}
			setIsLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const hasPermission = (module: string, action: string, siteId?: string) => {
		if (isAdmin) return true;

		// Acesso universal ao dashboard e configurações locais (perfil/aparência)
		if (
			module === 'dashboard' ||
			module === 'settings_placeholder' ||
			module === 'settings'
		)
			return true;

		const hasModulePerm = permissions.includes(`${module}:${action}`);
		if (!hasModulePerm) return false;

		// Se estivermos verificando acesso a uma obra específica
		if (module === 'obras' && siteId) {
			if (allSites) return true;
			return allowedSites.includes(siteId);
		}

		return true;
	};

	const canAccessAny = (permissionsToCheck: string[]) => {
		if (isAdmin) return true;
		return permissionsToCheck.some((p) => permissions.includes(p));
	};

	return (
		<PermissionsContext.Provider
			value={{
				permissions,
				allowedSites,
				allSites,
				isLoading,
				isAdmin,
				hasPermission,
				canAccessAny,
			}}
		>
			{children}
		</PermissionsContext.Provider>
	);
};

export const usePermissions = () => {
	const context = useContext(PermissionsContext);
	if (context === undefined) {
		throw new Error(
			'usePermissions must be used within a PermissionsProvider',
		);
	}
	return context;
};
