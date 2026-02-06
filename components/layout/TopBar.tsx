import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, Settings } from 'lucide-react';

interface TopBarProps {
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSettings, isSettingsOpen }) => {
  const { currentTheme } = useTheme();

  return (
    <header 
      className="backdrop-blur-sm sticky top-0 z-30 px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center border-b transition-colors duration-300 shadow-sm"
      style={{ 
        backgroundColor: currentTheme.colors.sidebar, 
        borderColor: currentTheme.colors.border 
      }}
    >
       {/* Left Side: Empty now (Logo removed) */}
       <div className="flex items-center gap-4 w-full sm:w-auto">
       </div>

       {/* Right Side: Search + Settings + Profile */}
       <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
         
         {/* Global Search Bar */}
         <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: currentTheme.colors.card,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              } as any}
            />
         </div>

         {/* Settings Button - Toggles Sidebar */}
         <button 
           onClick={onToggleSettings}
           className={`p-2 rounded-lg transition-all hover:opacity-80 border ${isSettingsOpen ? 'ring-2 ring-opacity-50' : ''}`}
           style={{ 
             backgroundColor: isSettingsOpen ? currentTheme.colors.primary : currentTheme.colors.card,
             borderColor: currentTheme.colors.border,
             color: isSettingsOpen ? '#fff' : currentTheme.colors.textSecondary,
             outlineColor: currentTheme.colors.primary
           }}
           title="Configurações e Cadastros"
         >
           <Settings size={20} />
         </button>

         <div className="h-6 w-px mx-1" style={{ backgroundColor: currentTheme.colors.border }}></div>

         {/* Profile Info */}
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
       </div>
    </header>
  );
};