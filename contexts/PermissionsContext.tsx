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
    const loadPermissions = async () => {
      const user = authService.getCurrentUser();
      
      // Fallback for legacy admin (email check) or if user has no profile yet
      if (user?.role === 'admin' && !user.profileId) {
        setPermissions(['admin:full']);
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      if (user?.profileId) {
        try {
          const profile = await accessProfileService.getById(user.profileId);
          if (profile) {
            setPermissions(profile.permissions || []);
            setIsAdmin(profile.permissions.includes('admin:full'));
          }
        } catch (error) {
          console.error("Error loading permissions", error);
        }
      } else {
        // No user or no profile
        setPermissions([]);
      }
      setIsLoading(false);
    };

    loadPermissions();
  }, []);

  const hasPermission = (module: string, action: string) => {
    if (isAdmin) return true;
    return permissions.includes(`${module}:${action}`) || permissions.includes(`${module}:view`); 
    // Note: Checking specific action. If checking just access to page, usually 'view'.
    // Logic: 
    // - permissions.includes('admin:full') -> Handled by isAdmin state for speed
    // - permissions.includes('module:action') -> Specific check
  };

  // Helper strict check (e.g. for buttons)
  const checkPermission = (module: string, action: string) => {
    if (permissions.includes('admin:full')) return true;
    return permissions.includes(`${module}:${action}`);
  };

  const canAccessAny = (permissionsToCheck: string[]) => {
    if (permissions.includes('admin:full')) return true;
    return permissionsToCheck.some(p => permissions.includes(p));
  };

  return (
    <PermissionsContext.Provider value={{ 
      permissions, 
      isLoading, 
      isAdmin, 
      hasPermission: checkPermission, // Export the strict checker
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