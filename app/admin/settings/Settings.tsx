import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { themes } from '../../../lib/themes';
import { Check, LogOut } from 'lucide-react';
import { Theme } from '../../../types';
import { authService } from '../../../services/authService';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      
      {/* Appearance & Theme Section */}
      <section>
        <div className="mb-6">
          <h3 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>Aparência & Tema</h3>
          <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Personalize a interface para se adequar ao seu estilo.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {themes.map((theme: Theme) => {
            const isActive = currentTheme.id === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`relative group rounded-xl p-1 text-left transition-all border-2`}
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border
                }}
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                       {theme.name}
                     </span>
                     {isActive && (
                       <div className="rounded-full p-1" style={{ backgroundColor: theme.colors.primary }}>
                         <Check className="h-3 w-3 text-white" />
                       </div>
                     )}
                  </div>
                  
                  {/* Visual Preview Bars */}
                  <div className="space-y-2">
                     {/* Primary Bar */}
                     <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: theme.colors.primary }}></div>
                     {/* Secondary/Dark Bar */}
                     <div className="flex space-x-2">
                        <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: theme.colors.background }}></div>
                        <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: theme.colors.primary }}></div>
                     </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Session Zone */}
      <section>
        <div className="mb-4">
           <h3 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>Sessão</h3>
           <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Gerencie seu acesso atual.</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl border transition-colors hover:bg-red-500/10 hover:border-red-500"
          style={{ 
            backgroundColor: currentTheme.colors.card,
            borderColor: currentTheme.colors.border,
            color: '#ef4444' // Red-500
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair do Sistema</span>
        </button>
      </section>

    </div>
  );
};

export default SettingsPage;