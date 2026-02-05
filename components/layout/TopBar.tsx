import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, Settings } from 'lucide-react';

interface TopBarProps {
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSettings, isSettingsOpen }) => {
  const { currentTheme } = useTheme();

  const logoUrl = "https://awsop.s3.us-east-1.amazonaws.com/App/_Dados/Empresa/684304/Logotipo/cc297513-bdf3-41c3-b3f6-099a79b78582-p.jpg?X-Amz-Expires=86400&response-content-disposition=inline%3B%20filename%3D%22cc297513-bdf3-41c3-b3f6-099a79b78582-p.jpg%22&response-content-type=image%2Fjpeg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVY7ARSU3IXBXOBHS%2F20260205%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260205T142806Z&X-Amz-SignedHeaders=host&X-Amz-Signature=b185b8062d201b758e4595f6d16e1ca81bfecd2b4b55594c0dddce2516884377";

  return (
    <header 
      className="backdrop-blur-sm sticky top-0 z-10 px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center border-b transition-colors duration-300"
      style={{ 
        backgroundColor: currentTheme.colors.sidebar, 
        borderColor: currentTheme.colors.border 
      }}
    >
       {/* Left Side: Logo Only */}
       <div className="flex items-center gap-4 w-full sm:w-auto">
         <img 
            src={logoUrl} 
            alt="Logo Empresa" 
            className="h-10 w-auto object-contain rounded-md"
         />
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