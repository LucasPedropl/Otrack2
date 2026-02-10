import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  isSettingsOpen: boolean;
  isSettingsCollapsed: boolean;
  toggleSettingsOpen: () => void;
  toggleSettingsCollapse: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('obralog_settings_open');
    return saved === 'true'; 
  });

  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(() => {
    const saved = localStorage.getItem('obralog_settings_collapsed');
    return saved === 'true';
  });

  const toggleSettingsOpen = () => {
    const newState = !isSettingsOpen;
    setIsSettingsOpen(newState);
    localStorage.setItem('obralog_settings_open', String(newState));
  };

  const toggleSettingsCollapse = () => {
    const newState = !isSettingsCollapsed;
    setIsSettingsCollapsed(newState);
    localStorage.setItem('obralog_settings_collapsed', String(newState));
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    localStorage.setItem('obralog_settings_open', 'true');
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
    localStorage.setItem('obralog_settings_open', 'false');
  };

  return (
    <SettingsContext.Provider value={{ 
      isSettingsOpen, 
      isSettingsCollapsed, 
      toggleSettingsOpen, 
      toggleSettingsCollapse,
      openSettings,
      closeSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsSidebar = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsSidebar must be used within a SettingsProvider');
  }
  return context;
};