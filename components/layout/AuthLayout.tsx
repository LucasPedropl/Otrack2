import React from 'react';
import { LayoutProps } from '../../types';
import { HardHat } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const AuthLayout: React.FC<Omit<LayoutProps, 'bgColor'>> = ({ children }) => {
  const { currentTheme } = useTheme();

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      <div 
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden border transition-colors duration-300"
        style={{ 
          backgroundColor: currentTheme.colors.card,
          borderColor: currentTheme.colors.border 
        }}
      >
        <div 
          className="p-8 flex flex-col items-center border-b"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <div 
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors"
            style={{ 
              backgroundColor: `${currentTheme.colors.primary}20`, // 20% opacity
            }}
          >
            <HardHat className="h-8 w-8" style={{ color: currentTheme.colors.primary }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>ObraLog</h1>
          <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>Acesso ao Almoxarifado</p>
        </div>
        <div className="p-8">
          {children}
        </div>
        <div 
          className="px-8 py-4 border-t text-center"
          style={{ 
            backgroundColor: currentTheme.colors.sidebar, // Slightly darker than card usually
            borderColor: currentTheme.colors.border 
          }}
        >
          <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>Sistema seguro de gestão de obras</p>
        </div>
      </div>
    </div>
  );
};