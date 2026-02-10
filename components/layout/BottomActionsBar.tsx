import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 backdrop-blur-sm"
      style={{ 
        backgroundColor: `${currentTheme.colors.card}F2`,
        // Removing standard border/boxShadow to use physical line below
      }}
    >
      {/* Physical 1px line at top to prevent sub-pixel rendering gaps/aliasing */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ backgroundColor: currentTheme.colors.border }} />

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
               className="p-2 rounded-lg border border-solid hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
               className="p-2 rounded-lg border border-solid hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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