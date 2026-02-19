
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { siteInventoryService } from '../../../../services/siteInventoryService';
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService';
import { StockMovement } from '../../../../types';
import { Search, ArrowDownLeft, ArrowUpRight, Calendar, User, FileText, ArrowLeftRight, X, Info, Truck, Box } from 'lucide-react';
import { BottomActionsBar } from '../../../../components/layout/BottomActionsBar';

// Extend StockMovement for UI purposes
interface ExtendedStockMovement extends StockMovement {
    isRented?: boolean;
}

const ObraMovements: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  
  const [movements, setMovements] = useState<ExtendedStockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Item for Modal
  const [selectedMovement, setSelectedMovement] = useState<ExtendedStockMovement | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchMovements = async () => {
    if (!siteId) return;
    setIsLoading(true);
    try {
        const [invMovements, rentedData] = await Promise.all([
            siteInventoryService.getAllSiteMovements(siteId),
            rentedEquipmentService.getAll(siteId)
        ]);

        // Transform Rented Equipment events into movements
        const rentedMovements: ExtendedStockMovement[] = [];
        rentedData.forEach(r => {
            // Entry (Creation/Registration)
            rentedMovements.push({
                id: `rent_in_${r.id}`,
                type: 'IN',
                date: r.entryDate,
                quantity: r.quantity,
                itemName: r.name,
                itemUnit: r.unit,
                userName: 'Sistema',
                reason: `Locação: ${r.supplier}`,
                isRented: true
            });
            // Exit (Return)
            if (r.exitDate) {
                rentedMovements.push({
                    id: `rent_out_${r.id}`,
                    type: 'OUT',
                    date: r.exitDate,
                    quantity: r.quantity,
                    itemName: r.name,
                    itemUnit: r.unit,
                    userName: 'Sistema',
                    reason: 'Devolução Locação',
                    isRented: true
                });
            }
        });

        // Merge standard stock movements
        const standardMovements: ExtendedStockMovement[] = invMovements.map(m => ({ ...m, isRented: false }));

        // Combine and Sort descending
        const combined = [...standardMovements, ...rentedMovements]
            .sort((a, b) => b.date.getTime() - a.date.getTime());

        setMovements(combined);
    } catch (error) {
        console.error("Failed to fetch movements", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [siteId]);

  const handleExport = () => {
    const headers = ["Data/Hora", "Origem", "Tipo", "Item", "Unidade", "Quantidade", "Usuário", "Motivo"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + movements.map(m => {
           const dateStr = m.date.toLocaleString('pt-BR');
           const origin = m.isRented ? 'Locado' : 'Estoque';
           return `${dateStr},${origin},${m.type === 'IN' ? 'Entrada' : 'Saída'},${m.itemName},${m.itemUnit},${m.quantity},${m.userName || 'Sistema'},${m.reason || ''}`;
       }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `movimentacoes_obra_${siteId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter
  const filteredData = movements.filter(m => 
    (m.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (m.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (m.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  // Pagination
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por item, usuário ou motivo..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: currentTheme.colors.card,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
                '--tw-ring-color': currentTheme.colors.primary 
              } as any}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        {/* Simple Stats or Filter Indicators could go here */}
        <div className="text-sm opacity-70" style={{ color: currentTheme.colors.text }}>
            {filteredData.length} registros encontrados
        </div>
      </div>

      {/* Table Content */}
      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Origem</th>
                <th className="p-4 font-medium text-center" style={{ color: currentTheme.colors.textSecondary }}>Tipo</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Item</th>
                <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Quantidade</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Usuário</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Motivo / Obs.</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                 <tr>
                    <td colSpan={7} className="p-8 text-center opacity-60" style={{ color: currentTheme.colors.text }}>
                        Carregando histórico...
                    </td>
                 </tr>
              ) : currentData.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="p-8 text-center opacity-50">
                      <ArrowLeftRight className="h-8 w-8 mx-auto mb-2" />
                      Nenhuma movimentação encontrada.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => {
                  const isEntry = item.type === 'IN';
                  
                  return (
                    <tr 
                        key={item.id || index}
                        onClick={() => setSelectedMovement(item)}
                        className="group hover:opacity-80 transition-colors cursor-pointer"
                        style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                    >
                        <td className="p-4 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="opacity-50" />
                                {item.date.toLocaleDateString()} <span className="opacity-50 text-xs">{item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </td>
                        <td className="p-4">
                            <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded w-fit ${item.isRented ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.isRented ? <Truck size={10} /> : <Box size={10} />}
                                {item.isRented ? 'Locado' : 'Estoque'}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${isEntry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isEntry ? <ArrowDownLeft size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />}
                                {isEntry ? 'ENTRADA' : 'SAÍDA'}
                            </span>
                        </td>
                        <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>
                            {item.itemName || 'Item desconhecido'}
                        </td>
                        <td className="p-4 text-right font-bold" style={{ color: isEntry ? '#16a34a' : '#dc2626' }}>
                            {isEntry ? '+' : '-'}{item.quantity} <span className="text-xs font-normal opacity-70" style={{ color: currentTheme.colors.text }}>{item.itemUnit}</span>
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.text }}>
                            <div className="flex items-center gap-2 text-xs">
                                <User size={14} className="opacity-50" />
                                {item.userName || 'Sistema'}
                            </div>
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>
                            <div className="flex items-center gap-2 text-xs max-w-[200px]">
                                {item.reason && <FileText size={14} className="opacity-50 flex-shrink-0" />}
                                <span className="truncate" title={item.reason}>{item.reason || '-'}</span>
                            </div>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BottomActionsBar 
        totalItems={filteredData.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onImport={() => {}}
        onExport={handleExport}
      />

      {/* DETAIL MODAL */}
      {selectedMovement && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedMovement(null)}
        >
          <div 
            className="w-full max-w-md rounded-2xl shadow-2xl border relative overflow-hidden"
            style={{ 
              backgroundColor: currentTheme.colors.card, 
              borderColor: currentTheme.colors.border 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
             {/* Header */}
             <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: currentTheme.colors.border }}>
                <div className="flex items-start gap-3">
                   <div className={`p-3 rounded-full ${selectedMovement.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {selectedMovement.type === 'IN' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                   </div>
                   <div>
                      <h3 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>Detalhes da Movimentação</h3>
                      <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>
                         {selectedMovement.date.toLocaleString()}
                      </p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedMovement(null)}
                  className="p-2 rounded-full hover:bg-black/10 transition-colors"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                   <X size={20} />
                </button>
             </div>

             {/* Content */}
             <div className="p-6 space-y-4">
                
                <div className="flex justify-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${selectedMovement.isRented ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {selectedMovement.isRented ? <Truck size={14} /> : <Box size={14} />}
                        {selectedMovement.isRented ? 'Origem: Equipamento Locado' : 'Origem: Estoque Próprio'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border bg-opacity-50" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <span className="text-xs opacity-60 block mb-1" style={{ color: currentTheme.colors.textSecondary }}>Item</span>
                        <span className="font-medium" style={{ color: currentTheme.colors.text }}>{selectedMovement.itemName}</span>
                    </div>
                    <div className="p-3 rounded-lg border bg-opacity-50" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <span className="text-xs opacity-60 block mb-1" style={{ color: currentTheme.colors.textSecondary }}>Quantidade</span>
                        <span className={`font-bold text-lg ${selectedMovement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                           {selectedMovement.type === 'IN' ? '+' : '-'}{selectedMovement.quantity} {selectedMovement.itemUnit}
                        </span>
                    </div>
                </div>

                <div>
                    <span className="text-xs opacity-60 block mb-1" style={{ color: currentTheme.colors.textSecondary }}>Responsável</span>
                    <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                       <User size={16} className="opacity-50" style={{ color: currentTheme.colors.text }} />
                       <span style={{ color: currentTheme.colors.text }}>{selectedMovement.userName || 'Sistema'}</span>
                    </div>
                </div>

                <div>
                    <span className="text-xs opacity-60 block mb-1" style={{ color: currentTheme.colors.textSecondary }}>Observação / Motivo</span>
                    <div className="p-3 rounded border min-h-[80px] text-sm leading-relaxed" style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.text, backgroundColor: currentTheme.colors.background }}>
                       {selectedMovement.reason ? selectedMovement.reason : <span className="opacity-50 italic">Nenhuma observação registrada.</span>}
                    </div>
                </div>

             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ObraMovements;
