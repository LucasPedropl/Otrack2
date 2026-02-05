import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TopBarProps {
  pageTitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ pageTitle }) => {
  const { currentTheme } = useTheme();

  return (
    <header 
      className="backdrop-blur-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center border-b transition-colors duration-300"
      style={{ 
        backgroundColor: currentTheme.colors.sidebar, // Using sidebar color for header to match the "frame" look
        borderColor: currentTheme.colors.border 
      }}
    >
       <h2 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>{pageTitle || 'Painel'}</h2>
       <div className="flex items-center space-x-4">
         <div className="text-right hidden sm:block">
           <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>Pedro Mota</p>
           <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>Administrador</p>
         </div>
         <div 
           className="h-10 w-10 rounded-full flex items-center justify-center font-bold border-2"
           style={{ 
             backgroundColor: currentTheme.colors.card, 
             borderColor: currentTheme.colors.border,
             color: currentTheme.colors.primary
           }}
         >
           PM
         </div>
       </div>
    </header>
  );
};