import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Button } from '../ui/Button';
import { Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

interface BottomActionsBarProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onImport: () => void;
  onExport: () => void;
  isExporting?: boolean;
  isImporting?: boolean;
}

export const BottomActionsBar: React.FC<BottomActionsBarProps> = ({
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onImport,
  onExport,
  isExporting = false,
  isImporting = false
}) => {
  const { currentTheme } = useTheme();
  const { isCollapsed } = useSidebar();

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calcula a margem esquerda baseada no estado da sidebar
  // w-20 (80px) quando colapsado, w-64 (256px) quando expandido (apenas desktop)
  const leftOffsetClass = isCollapsed ? 'md:left-20' : 'md:left-64';

  return (
    <div 
      className={`fixed bottom-0 right-0 left-0 ${leftOffsetClass} z-20 border-t transition-[left] duration-300`}
      style={{ 
        backgroundColor: currentTheme.colors.card,
        borderColor: currentTheme.colors.border,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">
        
        {/* Left: Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <Button 
            variant="secondary" 
            onClick={onImport}
            isLoading={isImporting}
            className="text-xs sm:text-sm h-9"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button 
            variant="secondary"
            onClick={onExport}
            isLoading={isExporting}
            className="text-xs sm:text-sm h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Right: Pagination & Count */}
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-end">
          <span className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            {totalItems === 0 ? '0 itens' : `${startItem}-${endItem} de ${totalItems} itens`}
          </span>

          <div className="flex items-center gap-1">
             <button
               onClick={() => onPageChange(currentPage - 1)}
               disabled={currentPage === 1 || totalItems === 0}
               className="p-2 rounded-lg border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               style={{ 
                 borderColor: currentTheme.colors.border, 
                 color: currentTheme.colors.text 
               }}
             >
               <ChevronLeft size={16} />
             </button>
             
             <div className="px-2 text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                Pág. {currentPage}
             </div>

             <button
               onClick={() => onPageChange(currentPage + 1)}
               disabled={currentPage === totalPages || totalItems === 0}
               className="p-2 rounded-lg border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               style={{ 
                 borderColor: currentTheme.colors.border, 
                 color: currentTheme.colors.text 
               }}
             >
               <ChevronRight size={16} />
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};