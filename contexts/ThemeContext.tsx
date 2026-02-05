import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';
import { themes } from '../lib/themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage to prevent flash of default theme
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('obralog_theme_id');
    if (savedThemeId) {
      const foundTheme = themes.find(t => t.id === savedThemeId);
      if (foundTheme) {
        return foundTheme;
      }
    }
    // Default to Light Minimal if no preference is saved
    return themes.find(t => t.id === 'light-minimal') || themes[0];
  });

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('obralog_theme_id', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};