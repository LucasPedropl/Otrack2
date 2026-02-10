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
      className="backdrop-blur-sm sticky top-0 z-30 px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center transition-colors duration-300 relative"
      style={{ 
        backgroundColor: currentTheme.colors.sidebar, 
      }}
    >
       {/* Physical Border Line - Using opacity for subtle look on dark/colored sidebars */}
       <div 
         className="absolute bottom-0 left-0 right-0 h-[1px]" 
         style={{ 
           backgroundColor: currentTheme.colors.sidebarText, 
           opacity: 0.12 
         }} 
       />

       {/* Left Side: Empty now (Logo removed) */}
       <div className="flex items-center gap-4 w-full sm:w-auto">
       </div>

       {/* Right Side: Search + Settings + Profile */}
       <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
         
         {/* Global Search Bar */}
         <div className="relative hidden md:block w-64">
            {/* Icon color uses global text color inside the input which is white/light */}
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
           className={`p-2 rounded-lg transition-all hover:bg-white/10`}
           style={{ 
             // When active: Primary color. When inactive: Transparent (blends with header)
             backgroundColor: isSettingsOpen ? currentTheme.colors.primary : 'transparent',
             // Border uses sidebarText opacity to be visible on dark headers but subtle
             border: `1px solid ${isSettingsOpen ? currentTheme.colors.primary : currentTheme.colors.sidebarText}`,
             borderColor: isSettingsOpen ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
             // Icon uses sidebarText (white on dark headers)
             color: isSettingsOpen ? '#fff' : currentTheme.colors.sidebarText,
             // Subtle opacity for border when inactive
             opacity: isSettingsOpen ? 1 : 0.8
           }}
           title="Configurações e Cadastros"
         >
           <Settings size={20} style={{ opacity: isSettingsOpen ? 1 : 0.8 }} />
         </button>

         {/* Divider with opacity based on Sidebar Text (visible on dark) */}
         <div 
           className="h-6 w-px mx-1" 
           style={{ 
             backgroundColor: currentTheme.colors.sidebarText, 
             opacity: 0.12 
           }}
         ></div>

         {/* Profile Info */}
         <div className="flex items-center space-x-4">
           <div className="text-right hidden sm:block">
             {/* Text colors mapped to sidebarText to ensure visibility on dark headers */}
             <p className="text-sm font-medium" style={{ color: currentTheme.colors.sidebarText }}>Pedro Mota</p>
             <p className="text-xs" style={{ color: currentTheme.colors.sidebarText, opacity: 0.7 }}>Administrador</p>
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