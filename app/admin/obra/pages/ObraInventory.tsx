import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Package } from 'lucide-react';

const ObraInventory: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
        <div 
          className="p-4 rounded-full mb-4"
          style={{ backgroundColor: `${currentTheme.colors.primary}10` }}
        >
          <Package size={32} style={{ color: currentTheme.colors.primary }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: currentTheme.colors.text }}>Almoxarifado da Obra</h2>
        <p className="max-w-md text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Aqui serão listados os materiais alocados especificamente para esta obra, permitindo requisições e baixas.
        </p>
    </div>
  );
};

export default ObraInventory;