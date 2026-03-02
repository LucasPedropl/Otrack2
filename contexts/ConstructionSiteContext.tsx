import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { ConstructionSite } from '../types';
import { constructionService } from '../services/constructionService';
import { authService } from '../services/authService';

interface ConstructionSiteContextType {
	sites: ConstructionSite[];
	isLoading: boolean;
	refreshSites: () => Promise<void>;
}

const ConstructionSiteContext = createContext<
	ConstructionSiteContextType | undefined
>(undefined);

export const ConstructionSiteProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [sites, setSites] = useState<ConstructionSite[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refreshSites = useCallback(async () => {
		// Só busca se tiver usuário logado
		if (!authService.getCurrentUser()) {
			setSites([]);
			setIsLoading(false);
			return;
		}

		try {
			const data = await constructionService.getAll();
			setSites(data);
		} catch (error) {
			// Silencia erro se for problema de permissão durante logout
			// console.error("Failed to fetch sites context", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Ouve mudanças de auth para recarregar ou limpar dados
	useEffect(() => {
		const unsubscribe = authService.onAuthStateChanged((user) => {
			if (user) {
				refreshSites();
			} else {
				setSites([]);
			}
		});
		return () => unsubscribe();
	}, [refreshSites]);

	return (
		<ConstructionSiteContext.Provider
			value={{ sites, isLoading, refreshSites }}
		>
			{children}
		</ConstructionSiteContext.Provider>
	);
};

export const useConstructionSites = () => {
	const context = useContext(ConstructionSiteContext);
	if (context === undefined) {
		throw new Error(
			'useConstructionSites must be used within a ConstructionSiteProvider',
		);
	}
	return context;
};
