
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { accessProfileService } from '../services/accessProfileService';

interface PermissionsContextType {
  permissions: string[];
  allowedSites: string[];
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (module: string, action: string, siteId?: string) => boolean;
  canAccessAny: (permissionsToCheck: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const SUPER_ADMIN_EMAILS = ['pedrolucasmota2005@gmail.com', 'pedro@gmail.com', 'teste@gmail.com'];

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allowedSites, setAllowedSites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      
      if (user) {
        // 1. Verificação de Super Admin por Email (Override total)
        if (SUPER_ADMIN_EMAILS.includes(user.email)) {
          setPermissions(['admin:full']);
          setAllowedSites([]); // Vazio = Todas as obras
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // 2. Carregar permissões do Perfil de Acesso
        if (user.profileId) {
          try {
            const profile = await accessProfileService.getById(user.profileId);
            if (profile) {
              setPermissions(profile.permissions || []);
              setAllowedSites(profile.allowedSites || []);
              setIsAdmin(profile.permissions.includes('admin:full'));
            } else {
              setPermissions([]);
              setAllowedSites([]);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error loading permissions", error);
            setPermissions([]);
            setAllowedSites([]);
            setIsAdmin(false);
          }
        } else {
          // Usuário logado mas sem perfil definido (ex: operário novo)
          setPermissions([]);
          setAllowedSites([]);
          setIsAdmin(false);
        }
      } else {
        setPermissions([]);
        setAllowedSites([]);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (module: string, action: string, siteId?: string) => {
    if (isAdmin) return true;
    
    // Verifica permissão do módulo
    const hasModulePerm = permissions.includes(`${module}:${action}`);
    if (!hasModulePerm) return false;

    // Se for um módulo de obra e houver um siteId, verifica restrição de site
    if (module === 'obras' && siteId && allowedSites.length > 0) {
      return allowedSites.includes(siteId);
    }

    return true;
  };

  const canAccessAny = (permissionsToCheck: string[]) => {
    if (isAdmin) return true;
    return permissionsToCheck.some(p => permissions.includes(p));
  };

  return (
    <PermissionsContext.Provider value={{ 
      permissions, 
      allowedSites,
      isLoading, 
      isAdmin, 
      hasPermission,
      canAccessAny 
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
