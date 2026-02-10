import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderProps {
  title: string;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
      <div 
        className="p-6 rounded-full mb-6"
        style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
      >
        <Construction size={48} style={{ color: currentTheme.colors.primary }} />
      </div>
      
      <h1 className="text-3xl font-bold mb-4" style={{ color: currentTheme.colors.text }}>
        {title}
      </h1>
      
      <p className="text-lg mb-8 max-w-md" style={{ color: currentTheme.colors.textSecondary }}>
        {description}
      </p>
      
      <div className="p-4 border rounded-xl bg-opacity-50 max-w-lg w-full" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <p className="text-sm font-mono opacity-70" style={{ color: currentTheme.colors.text }}>
            Status: Em desenvolvimento<br/>
            Módulo: Configurações do Sistema
          </p>
      </div>

      <button 
          onClick={() => navigate('/admin/dashboard')}
          className="mt-8 flex items-center gap-2 text-sm hover:underline"
          style={{ color: currentTheme.colors.primary }}
      >
          <ArrowLeft size={16} />
          Voltar para Dashboard
      </button>
    </div>
  );
};

export default PlaceholderPage;