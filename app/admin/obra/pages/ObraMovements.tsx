import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ArrowLeftRight } from 'lucide-react';

const ObraMovements: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
        <div 
          className="p-4 rounded-full mb-4"
          style={{ backgroundColor: `${currentTheme.colors.primary}10` }}
        >
          <ArrowLeftRight size={32} style={{ color: currentTheme.colors.primary }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: currentTheme.colors.text }}>Histórico de Movimentações</h2>
        <p className="max-w-md text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Registro de todas as entradas e saídas de materiais referentes a esta obra.
        </p>
    </div>
  );
};

export default ObraMovements;