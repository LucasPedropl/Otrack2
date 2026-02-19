
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { siteInventoryService } from '../../../../services/siteInventoryService';
import { toolService } from '../../../../services/toolService';
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService';
import { SiteInventoryItem, ToolLoan, RentedEquipment } from '../../../../types';
import { Search, Hammer, User, ArrowRight, CheckCircle, RotateCcw, AlertCircle, Filter, X, Clock, Settings, CheckSquare, Square, Truck, ExternalLink } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

// Categorias padrão que consideramos "Ferramentas" para o filtro inteligente (Fallback)
const TOOL_KEYWORDS = ['ferramenta', 'máquina', 'maquina', 'equipamento', 'epi', 'acessório', 'furadeira', 'serra', 'martelo'];

const ObraTools: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const [inventory, setInventory] = useState<SiteInventoryItem[]>([]);
  const [rentedEquipment, setRentedEquipment] = useState<RentedEquipment[]>([]);
  const [activeLoans, setActiveLoans] = useState<ToolLoan[]>([]);
  const [loanHistory, setLoanHistory] = useState<ToolLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<'inventory' | 'active_loans' | 'history'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Modal Loan
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<SiteInventoryItem | null>(null);
  const [loanData, setLoanData] = useState({ workerName: '', quantity: 1, notes: '' });

  // Modal Manage List (Selection)
  const [isManageListOpen, setIsManageListOpen] = useState(false);
  const [manageSearch, setManageSearch] = useState('');

  const fetchData = async () => {
    if (!siteId) return;
    setIsLoading(true);
    try {
      const [items, activeRented, loans, history] = await Promise.all([
        siteInventoryService.getSiteInventory(siteId),
        rentedEquipmentService.getAll(siteId),
        toolService.getActiveLoans(siteId),
        toolService.getLoanHistory(siteId)
      ]);
      
      setInventory(items);
      // Filter only active rented equipment for the tools list
      setRentedEquipment(activeRented.filter(r => r.status === 'ACTIVE'));
      setActiveLoans(loans);
      setLoanHistory(history);

      // Extract categories for dropdown
      const cats = Array.from(new Set(items.map(i => i.category))).sort();
      setAvailableCategories(cats);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  // -- Helpers --
  const isToolCategory = (category: string) => {
    const lower = category.toLowerCase();
    return TOOL_KEYWORDS.some(keyword => lower.includes(keyword));
  };

  // Verifica se o item é ferramenta (ou pela categoria ou pela flag manual)
  const isTool = (item: SiteInventoryItem) => {
    return item.isTool || isToolCategory(item.category);
  };

  // Calcula estoque disponível (Total - Emprestado)
  const getAvailableQuantity = (item: SiteInventoryItem) => {
    const borrowed = activeLoans
      .filter(l => l.siteItemId === item.id)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    return Math.max(0, item.quantity - borrowed);
  };

  const loansNotReturnedToday = activeLoans.length;

  // -- Handlers --

  const handleOpenLoan = (item: SiteInventoryItem) => {
    setSelectedTool(item);
    setLoanData({ workerName: '', quantity: 1, notes: '' });
    setIsLoanModalOpen(true);
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !selectedTool) return;

    const available = getAvailableQuantity(selectedTool);
    if (loanData.quantity > available) {
        alert(`Estoque insuficiente. Disponível: ${available}`);
        return;
    }

    try {
        await toolService.createLoan(siteId, {
            siteItemId: selectedTool.id!,
            itemName: selectedTool.name,
            workerName: loanData.workerName,
            quantity: loanData.quantity,
            loanDate: new Date(),
            notes: loanData.notes
        });
        setIsLoanModalOpen(false);
        fetchData();
    } catch (error) {
        console.error(error);
        alert("Erro ao registrar empréstimo.");
    }
  };

  const handleReturn = async (loan: ToolLoan) => {
    if (!siteId) return;
    if (window.confirm(`Confirmar devolução de ${loan.quantity}x ${loan.itemName} por ${loan.workerName}?`)) {
        try {
            await toolService.returnLoan(siteId, loan.id!);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao devolver.");
        }
    }
  };

  const toggleItemAsTool = async (item: SiteInventoryItem) => {
      if (!siteId) return;
      try {
          // Optimistic update for UI in modal
          const newStatus = !item.isTool;
          setInventory(prev => prev.map(i => i.id === item.id ? { ...i, isTool: newStatus } : i));
          
          await siteInventoryService.updateItem(siteId, item.id!, { isTool: newStatus });
      } catch (error) {
          console.error(error);
          fetchData(); // Revert on error
      }
  };

  // Filter Logic
  // Show if manually marked OR (if category matches keyword AND not manually unmarked - not implemented unmark yet, assuming manual overrides)
  // Current logic: Show if isTool is true OR category matches.
  // We want to be strict if the user is using the "Manage List".
  // Let's stick to: Show if isTool is TRUE OR Category matches keywords.
  
  const displayInventory = inventory.filter(item => {
     const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesCat = categoryFilter ? item.category === categoryFilter : true;
     const isConsideredTool = isTool(item);
     return matchesSearch && matchesCat && isConsideredTool;
  });

  const displayRented = rentedEquipment.filter(item => 
     item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  return (
    <div className="space-y-6">
       
       {/* Stats / Header */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Hammer size={24} /></div>
             <div>
                <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Ferramentas Próprias</p>
                <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{displayInventory.reduce((acc, i) => acc + getAvailableQuantity(i), 0)}</p>
             </div>
          </div>
          <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Truck size={24} /></div>
             <div>
                <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Equipamentos Alugados</p>
                <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{rentedEquipment.length}</p>
             </div>
          </div>
          <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <div className="p-3 rounded-full bg-orange-100 text-orange-600"><User size={24} /></div>
             <div>
                <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Empréstimos Ativos</p>
                <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{activeLoans.length}</p>
             </div>
          </div>
       </div>

       {/* Tabs */}
       <div className="flex gap-4 border-b" style={{ borderColor: currentTheme.colors.border }}>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-blue-500 text-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ color: activeTab === 'inventory' ? undefined : currentTheme.colors.text }}
          >
             Ferramentas Disponíveis
          </button>
          <button 
            onClick={() => setActiveTab('active_loans')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active_loans' ? 'border-orange-500 text-orange-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ color: activeTab === 'active_loans' ? undefined : currentTheme.colors.text }}
          >
             Empréstimos ({activeLoans.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-gray-500 text-gray-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
            style={{ color: activeTab === 'history' ? undefined : currentTheme.colors.text }}
          >
             Histórico
          </button>
       </div>

       {/* INVENTORY TAB */}
       {activeTab === 'inventory' && (
          <div className="space-y-4">
             {/* Filters */}
             <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
                   <input 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     placeholder="Buscar ferramenta ou equipamento..."
                     className={baseInputClass}
                     style={{ ...dynamicInputStyle, paddingLeft: '2.5rem' }}
                   />
                </div>
                <div className="w-full sm:w-48">
                   <select 
                     value={categoryFilter}
                     onChange={e => setCategoryFilter(e.target.value)}
                     className={baseInputClass}
                     style={dynamicInputStyle}
                   >
                      <option value="">Todas Categorias</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                
                <Button 
                    onClick={() => { setManageSearch(''); setIsManageListOpen(true); }}
                    variant="secondary"
                    className="whitespace-nowrap"
                >
                    <Settings size={16} className="mr-2" />
                    Gerenciar Lista
                </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* RENTED EQUIPMENT CARDS */}
                {displayRented.map(rented => (
                    <div key={`rented-${rented.id}`} className="p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                        <div className="absolute top-0 right-0 p-2 bg-purple-500 text-white rounded-bl-xl text-xs font-bold shadow-sm">
                            ALUGADO
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-2 pr-12">
                               <h4 className="font-bold" style={{ color: currentTheme.colors.text }}>{rented.name}</h4>
                            </div>
                            <div className="flex flex-col gap-1 text-sm mb-4">
                               <span className="opacity-70" style={{ color: currentTheme.colors.textSecondary }}>Forn: {rented.supplier}</span>
                               <span className="font-medium text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Disponível na Obra</span>
                            </div>
                        </div>
                        <Button 
                           onClick={() => navigate(`../rented`)}
                           variant="secondary"
                           className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                           <ExternalLink size={16} className="mr-2" />
                           Gerenciar em Alugados
                        </Button>
                    </div>
                ))}

                {/* OWNED INVENTORY CARDS */}
                {displayInventory.map(item => {
                   const available = getAvailableQuantity(item);
                   return (
                      <div key={item.id} className="p-4 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                         <div>
                            <div className="flex justify-between items-start mb-2">
                               <h4 className="font-bold" style={{ color: currentTheme.colors.text }}>{item.name}</h4>
                               <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/30 text-blue-500">Próprio</span> 
                            </div>
                            <div className="flex justify-between text-sm mb-4">
                               <span style={{ color: currentTheme.colors.textSecondary }}>Total: {item.quantity} {item.unit}</span>
                               <span className={`font-bold ${available === 0 ? 'text-red-500' : 'text-green-500'}`}>Disponível: {available}</span>
                            </div>
                         </div>
                         <Button 
                           onClick={() => handleOpenLoan(item)}
                           disabled={available <= 0}
                           variant={available <= 0 ? 'secondary' : 'primary'}
                           className="w-full"
                         >
                            {available <= 0 ? 'Indisponível' : 'Emprestar'}
                         </Button>
                      </div>
                   )
                })}
                
                {displayInventory.length === 0 && displayRented.length === 0 && (
                    <p className="col-span-full text-center py-8 opacity-50" style={{ color: currentTheme.colors.text }}>
                        Nenhuma ferramenta ou equipamento encontrado. Use o botão "Gerenciar Lista" para selecionar itens do almoxarifado.
                    </p>
                )}
             </div>
          </div>
       )}

       {/* ACTIVE LOANS TAB */}
       {activeTab === 'active_loans' && (
          <div className="space-y-4">
             {activeLoans.length === 0 ? (
                <div className="text-center py-12 opacity-50" style={{ color: currentTheme.colors.text }}>
                   <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                   <p>Todas as ferramentas estão no almoxarifado.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {activeLoans.map(loan => {
                      const diffTime = Math.abs(new Date().getTime() - loan.loanDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                      const isOverdue = diffDays > 1;

                      return (
                      <div key={loan.id} className={`p-4 rounded-xl border flex justify-between items-center ${isOverdue ? 'border-red-500/30 bg-red-500/5' : ''}`} style={{ backgroundColor: isOverdue ? undefined : currentTheme.colors.card, borderColor: isOverdue ? undefined : currentTheme.colors.border }}>
                         <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold" style={{ color: currentTheme.colors.text }}>{loan.itemName}</p>
                                {isOverdue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded uppercase font-bold">Atrasado</span>}
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                               <User size={14} />
                               <span>Com: <b>{loan.workerName}</b></span>
                               <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                               <span>{loan.quantity} unid.</span>
                            </div>
                            <p className="text-xs opacity-60 mt-1" style={{ color: currentTheme.colors.textSecondary }}>Retirado em {loan.loanDate.toLocaleString()}</p>
                            {loan.notes && <p className="text-xs italic mt-1 opacity-80" style={{ color: currentTheme.colors.text }}>Obs: {loan.notes}</p>}
                         </div>
                         <Button onClick={() => handleReturn(loan)} variant="secondary" className="h-10 border-orange-200 hover:bg-orange-50 text-orange-600">
                            <RotateCcw size={16} className="mr-2" /> Devolver
                         </Button>
                      </div>
                   )})}
                </div>
             )}
          </div>
       )}

       {/* HISTORY TAB */}
       {activeTab === 'history' && (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: currentTheme.colors.border }}>
             <table className="w-full text-left text-sm">
                <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
                   <tr>
                      <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data Retirada</th>
                      <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Ferramenta</th>
                      <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Responsável</th>
                      <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Status</th>
                      <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Devolução</th>
                   </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
                   {loanHistory.map(h => (
                      <tr key={h.id} style={{ backgroundColor: currentTheme.colors.card }}>
                         <td className="p-3" style={{ color: currentTheme.colors.text }}>{h.loanDate.toLocaleDateString()}</td>
                         <td className="p-3" style={{ color: currentTheme.colors.text }}>{h.quantity}x {h.itemName}</td>
                         <td className="p-3" style={{ color: currentTheme.colors.text }}>{h.workerName}</td>
                         <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${h.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                               {h.status === 'OPEN' ? 'Em uso' : 'Devolvido'}
                            </span>
                         </td>
                         <td className="p-3 opacity-70" style={{ color: currentTheme.colors.text }}>{h.returnDate?.toLocaleString() || '-'}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}

       {/* Loan Modal */}
       {isLoanModalOpen && selectedTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsLoanModalOpen(false)}>
             <div className="w-full max-w-sm rounded-2xl shadow-xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>Registrar Empréstimo</h3>
                <div className="mb-4 p-3 rounded bg-opacity-5 border" style={{ backgroundColor: currentTheme.colors.primary + '10', borderColor: currentTheme.colors.border }}>
                   <p className="font-bold" style={{ color: currentTheme.colors.text }}>{selectedTool.name}</p>
                   <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Disponível: {getAvailableQuantity(selectedTool)} {selectedTool.unit}</p>
                </div>
                
                <form onSubmit={handleSubmitLoan} className="space-y-4">
                   <div>
                      <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Responsável (Quem retirou?) *</label>
                      <input 
                        required
                        value={loanData.workerName}
                        onChange={e => setLoanData({...loanData, workerName: e.target.value})}
                        placeholder="Ex: João Pedreiro"
                        className={baseInputClass}
                        style={dynamicInputStyle}
                        autoFocus
                      />
                   </div>
                   <div>
                      <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Quantidade *</label>
                      <input 
                        type="number"
                        min="1"
                        max={getAvailableQuantity(selectedTool)}
                        value={loanData.quantity}
                        onChange={e => setLoanData({...loanData, quantity: parseInt(e.target.value)})}
                        className={baseInputClass}
                        style={dynamicInputStyle}
                      />
                   </div>
                   <div>
                      <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Observações</label>
                      <input 
                        value={loanData.notes}
                        onChange={e => setLoanData({...loanData, notes: e.target.value})}
                        placeholder="Opcional"
                        className={baseInputClass}
                        style={dynamicInputStyle}
                      />
                   </div>
                   
                   <div className="flex gap-2 pt-2">
                      <Button type="button" variant="secondary" onClick={() => setIsLoanModalOpen(false)} className="flex-1">Cancelar</Button>
                      <Button type="submit" className="flex-1">Confirmar Saída</Button>
                   </div>
                </form>
             </div>
          </div>
       )}

       {/* Manage Tool List Modal */}
       {isManageListOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsManageListOpen(false)}>
               <div className="w-full max-w-lg rounded-2xl shadow-xl border flex flex-col max-h-[85vh]" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
                   <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
                       <h3 className="font-bold" style={{ color: currentTheme.colors.text }}>Selecionar Ferramentas</h3>
                       <button onClick={() => setIsManageListOpen(false)}><X size={20} style={{ color: currentTheme.colors.textSecondary }} /></button>
                   </div>
                   <div className="p-4 border-b" style={{ borderColor: currentTheme.colors.border }}>
                       <input 
                           value={manageSearch}
                           onChange={(e) => setManageSearch(e.target.value)}
                           placeholder="Buscar no almoxarifado..."
                           className={baseInputClass}
                           style={dynamicInputStyle}
                           autoFocus
                       />
                   </div>
                   <div className="flex-1 overflow-y-auto p-2">
                       {inventory
                           .filter(i => i.name.toLowerCase().includes(manageSearch.toLowerCase()))
                           .map(item => (
                               <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer" onClick={() => toggleItemAsTool(item)}>
                                   <div>
                                       <p className="font-medium" style={{ color: currentTheme.colors.text }}>{item.name}</p>
                                       <p className="text-xs opacity-60" style={{ color: currentTheme.colors.textSecondary }}>{item.category}</p>
                                   </div>
                                   <div className={`transition-colors ${item.isTool ? 'text-blue-500' : 'text-gray-400'}`}>
                                       {item.isTool ? <CheckSquare size={24} /> : <Square size={24} />}
                                   </div>
                               </div>
                           ))}
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

export default ObraTools;
