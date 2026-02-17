import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { accessProfileService } from '../services/accessProfileService';

interface PermissionsContextType {
  permissions: string[];
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  canAccessAny: (permissionsToCheck: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen to real Firebase Auth changes
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      if (user) {
        // Fallback for legacy admin (email check) or if user has no profile yet
        if (user.role === 'admin' && !user.profileId) {
          setPermissions(['admin:full']);
          setIsAdmin(true);
        } else if (user.profileId) {
          try {
            const profile = await accessProfileService.getById(user.profileId);
            if (profile) {
              setPermissions(profile.permissions || []);
              setIsAdmin(profile.permissions.includes('admin:full'));
            } else {
              setPermissions([]);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error loading permissions", error);
            setPermissions([]);
            setIsAdmin(false);
          }
        } else {
          setPermissions([]);
          setIsAdmin(false);
        }
      } else {
        setPermissions([]);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (module: string, action: string) => {
    if (isAdmin) return true;
    return permissions.includes(`${module}:${action}`);
  };

  const canAccessAny = (permissionsToCheck: string[]) => {
    if (isAdmin) return true;
    return permissionsToCheck.some(p => permissions.includes(p));
  };

  return (
    <PermissionsContext.Provider value={{ 
      permissions, 
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