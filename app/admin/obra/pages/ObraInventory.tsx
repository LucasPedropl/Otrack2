
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { inventoryService } from '../../../../services/inventoryService'; // Global Items
import { siteInventoryService } from '../../../../services/siteInventoryService'; // Site Specific
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService'; // Rented
import { authService } from '../../../../services/authService';
import { InventoryItem, SiteInventoryItem, StockMovement, RentedEquipment } from '../../../../types';
import { Plus, Search, Package, Trash2, Edit, X, AlertTriangle, Eye, MinusCircle, PlusCircle, History, ArrowUpRight, ArrowDownLeft, Truck, Box } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { BottomActionsBar } from '../../../../components/layout/BottomActionsBar';

// Helper type for unified list
interface UnifiedInventoryItem {
  id: string;
  type: 'OWNED' | 'RENTED';
  name: string;
  category: string;
  quantity: number;
  unit: string;
  averagePrice: number;
  minThreshold: number;
  isTool?: boolean;
  originalData: SiteInventoryItem | RentedEquipment;
}

const ObraInventory: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  const currentUser = authService.getCurrentUser();
  
  // Data State
  const [unifiedItems, setUnifiedItems] = useState<UnifiedInventoryItem[]>([]);
  const [siteItems, setSiteItems] = useState<SiteInventoryItem[]>([]); // Keep original reference
  const [globalItems, setGlobalItems] = useState<InventoryItem[]>([]); // For dropdown
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<SiteInventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustData, setAdjustData] = useState({ quantity: 0, reason: '' });

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItemName, setHistoryItemName] = useState(''); // Unified Name
  const [historyItemUnit, setHistoryItemUnit] = useState(''); // Unified Unit
  const [historyData, setHistoryData] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form State (Create/Edit Item)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showItemOptions, setShowItemOptions] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const itemRef = React.useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    originalItemId: '',
    quantity: 0,
    minThreshold: 0,
    averagePrice: 0,
    // Removed isTool checkbox from form state init
  });

  // Selected global item details for display in modal
  const [selectedGlobalItem, setSelectedGlobalItem] = useState<InventoryItem | null>(null);

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!siteId) return;
    try {
      const [sItems, rentedItems, gItems] = await Promise.all([
        siteInventoryService.getSiteInventory(siteId),
        rentedEquipmentService.getAll(siteId),
        inventoryService.getAll()
      ]);

      setSiteItems(sItems);
      setGlobalItems(gItems);

      // Merge Items
      const owned: UnifiedInventoryItem[] = sItems.map(i => ({
          id: i.id!,
          type: 'OWNED',
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit,
          averagePrice: i.averagePrice || 0,
          minThreshold: i.minThreshold,
          isTool: i.isTool,
          originalData: i
      }));

      const rented: UnifiedInventoryItem[] = rentedItems.filter(r => r.status === 'ACTIVE').map(r => ({
          id: r.id!,
          type: 'RENTED',
          name: r.name,
          category: r.category || 'Locação',
          quantity: r.quantity || 1, // Default to 1 if not set
          unit: r.unit || 'UN',
          averagePrice: 0, // Usually rented items cost is monthly, not unit inventory value in this context
          minThreshold: 0,
          originalData: r
      }));

      setUnifiedItems([...owned, ...rented].sort((a, b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error("Failed to fetch inventory data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  // --- Handlers ---

  const handleGlobalItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    const item = globalItems.find(i => i.id === itemId) || null;
    setSelectedGlobalItem(item);
    setFormData(prev => ({ 
        ...prev, 
        originalItemId: itemId,
        averagePrice: item?.unitValue || 0 // Puxa o valor unitário padrão como inicial
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;

    setIsLoading(true);
    try {
      if (editingId) {
        // Edit existing site item
        await siteInventoryService.updateItem(siteId, editingId, {
            quantity: formData.quantity,
            minThreshold: formData.minThreshold,
            averagePrice: formData.averagePrice,
        });
      } else {
        // Add new item
        if (!selectedGlobalItem) {
            alert("Selecione um insumo.");
            setIsLoading(false);
            return;
        }

        // Check duplicates
        const exists = siteItems.find(i => i.originalItemId === selectedGlobalItem.id);
        if (exists) {
            alert("Este insumo já está cadastrado nesta obra. Edite a quantidade existente.");
            setIsLoading(false);
            return;
        }

        await siteInventoryService.addItem(siteId, {
            originalItemId: selectedGlobalItem.id!,
            name: selectedGlobalItem.name,
            unit: selectedGlobalItem.unit,
            category: selectedGlobalItem.category,
            quantity: formData.quantity,
            minThreshold: formData.minThreshold,
            averagePrice: formData.averagePrice,
            isTool: false // Default to false, manage in Tools page
        });
      }
      
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: SiteInventoryItem) => {
    const globalRef = globalItems.find(g => g.id === item.originalItemId) || {
        name: item.name,
        unit: item.unit,
        category: item.category,
        id: item.originalItemId
    } as InventoryItem;

    setSelectedGlobalItem(globalRef);
    setFormData({
        originalItemId: item.originalItemId,
        quantity: item.quantity,
        minThreshold: item.minThreshold,
        averagePrice: item.averagePrice || 0,
    });
    setEditingId(item.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId: string, type: 'OWNED' | 'RENTED') => {
    if (!siteId) return;
    
    if (type === 'RENTED') {
        alert("Para remover itens locados, utilize a aba 'Equip. Alugados' e registre a devolução.");
        return;
    }

    if (window.confirm("Tem certeza que deseja remover este item da obra?")) {
        try {
            await siteInventoryService.deleteItem(siteId, itemId);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir.");
        }
    }
  };

  // --- Adjustment Handlers ---
  const openAdjustModal = (item: UnifiedInventoryItem, type: 'IN' | 'OUT') => {
    if (item.type === 'RENTED') {
        alert("Ajuste de estoque não disponível para itens locados nesta tela.");
        return;
    }
    setAdjustItem(item.originalData as SiteInventoryItem);
    setAdjustType(type);
    setAdjustData({ quantity: 0, reason: '' });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !adjustItem) return;

    if (adjustData.quantity <= 0) {
        alert("A quantidade deve ser maior que zero.");
        return;
    }

    setIsLoading(true);
    try {
        await siteInventoryService.registerMovement(siteId, adjustItem.id!, {
            type: adjustType,
            quantity: adjustData.quantity,
            reason: adjustData.reason,
            userId: currentUser?.id,
            userName: currentUser?.name || currentUser?.email
        });
        setIsAdjustModalOpen(false);
        fetchData();
    } catch (error: any) {
        console.error(error);
        alert(error.message || "Erro ao registrar movimentação.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- History Handlers ---
  const openHistoryModal = async (item: UnifiedInventoryItem) => {
    setHistoryItemName(item.name);
    setHistoryItemUnit(item.unit);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryData([]); // Clear previous

    if (!siteId) return;

    try {
        if (item.type === 'RENTED') {
            // Generate synthetic history for rented items
            const rentedData = item.originalData as RentedEquipment;
            const movements: StockMovement[] = [];
            
            // Entrada
            movements.push({
                type: 'IN',
                quantity: rentedData.quantity,
                date: rentedData.entryDate,
                reason: `Início da Locação (Fornecedor: ${rentedData.supplier})`,
                userName: 'Sistema'
            });

            // Saída (Se já devolvido)
            if (rentedData.status === 'RETURNED' && rentedData.exitDate) {
                movements.push({
                    type: 'OUT',
                    quantity: rentedData.quantity,
                    date: rentedData.exitDate,
                    reason: 'Devolução de Locação',
                    userName: 'Sistema'
                });
            }
            
            setHistoryData(movements.sort((a, b) => b.date.getTime() - a.date.getTime()));

        } else {
            // Standard History from subcollection
            const history = await siteInventoryService.getItemHistory(siteId, item.id);
            setHistoryData(history);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setShowItemOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ originalItemId: '', quantity: 0, minThreshold: 0, averagePrice: 0 });
    setSelectedGlobalItem(null);
    setItemSearch('');
    setShowItemOptions(false);
  };

  const handleExport = () => {
    const headers = ["Insumo", "Origem", "Categoria", "Quantidade", "Unidade", "Preço Médio", "Total", "Estoque Mínimo"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + unifiedItems.map(i => {
           const total = (i.quantity * (i.averagePrice || 0)).toFixed(2);
           const origin = i.type === 'OWNED' ? 'Próprio' : 'Locado';
           return `${i.name},${origin},${i.category},${i.quantity},${i.unit},${i.averagePrice || 0},${total},${i.minThreshold}`;
       }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estoque_obra_${siteId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // --- Filter & Pagination ---
  const filteredData = unifiedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Styles ---
  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const labelStyle = { color: currentTheme.colors.text };
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  return (
    <>
       {/* Actions Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no almoxarifado..."
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

        <Button 
          onClick={() => {
            handleCloseModal(); // Reset state
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Table Content */}
      <div className="mb-8">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Insumo</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Origem</th>
                <th className="p-4 font-medium text-center" style={{ color: currentTheme.colors.textSecondary }}>Movimentações</th>
                <th className="p-4 font-medium text-center" style={{ color: currentTheme.colors.textSecondary }}>Ajuste Rápido</th>
                <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Qtd. em Obra</th>
                <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Total</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="p-8 text-center opacity-50">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      Nenhum item encontrado.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => {
                  const isLowStock = item.minThreshold > 0 && item.quantity <= item.minThreshold && item.type === 'OWNED';
                  const totalValue = item.quantity * (item.averagePrice || 0);
                  
                  return (
                    <tr 
                        key={item.id}
                        className="group hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                    >
                        <td className="p-4" style={{ color: currentTheme.colors.text }}>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs opacity-60">{item.category}</div>
                        </td>

                        {/* Origem Column */}
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${item.type === 'OWNED' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {item.type === 'OWNED' ? <Box size={12} /> : <Truck size={12} />}
                                {item.type === 'OWNED' ? 'Próprio' : 'Locado'}
                            </span>
                        </td>
                        
                        {/* History Icon (Enabled for All) */}
                        <td className="p-4 text-center">
                            <button 
                                onClick={() => openHistoryModal(item)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                                style={{ color: currentTheme.colors.text }}
                                title="Ver Histórico de Movimentações"
                            >
                                <Eye size={18} />
                            </button>
                        </td>

                        {/* Quick Adjust Buttons (Only Owned) */}
                        <td className="p-4 text-center">
                           {item.type === 'OWNED' && (
                            <div className="flex items-center justify-center gap-3">
                                <button 
                                    onClick={() => openAdjustModal(item, 'OUT')}
                                    className="text-red-500 hover:text-red-400 transition-colors hover:scale-110"
                                    title="Registrar Saída/Uso"
                                >
                                    <MinusCircle size={20} />
                                </button>
                                <button 
                                    onClick={() => openAdjustModal(item, 'IN')}
                                    className="text-green-500 hover:text-green-400 transition-colors hover:scale-110"
                                    title="Registrar Entrada/Compra"
                                >
                                    <PlusCircle size={20} />
                                </button>
                            </div>
                           )}
                        </td>

                        <td className="p-4 text-right font-bold" style={{ color: currentTheme.colors.text }}>
                            <div className="flex items-center justify-end gap-2">
                                {isLowStock && (
                                  <span title="Estoque Baixo">
                                    <AlertTriangle size={14} className="text-yellow-500" />
                                  </span>
                                )}
                                {item.quantity} <span className="text-xs font-normal opacity-70">{item.unit}</span>
                            </div>
                        </td>
                        <td className="p-4 text-right font-medium" style={{ color: currentTheme.colors.text }}>
                            {item.type === 'OWNED' ? formatCurrency(totalValue) : '-'}
                        </td>
                        <td className="p-4 text-center">
                           {item.type === 'OWNED' && (
                            <div className="flex items-center justify-center space-x-2">
                                <button 
                                onClick={() => handleEdit(item.originalData as SiteInventoryItem)}
                                className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                                title="Editar Item"
                                >
                                <Edit size={16} />
                                </button>
                                <button 
                                onClick={() => handleDelete(item.id, 'OWNED')}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Remover da Obra"
                                >
                                <Trash2 size={16} />
                                </button>
                            </div>
                           )}
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Static Bottom Bar */}
      <BottomActionsBar 
        totalItems={filteredData.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onImport={() => alert("Importação em breve")}
        onExport={handleExport}
        staticPosition={true}
      />

      {/* ADJUSTMENT MODAL */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsAdjustModalOpen(false)}>
            <div className="w-full max-w-sm rounded-2xl shadow-xl border relative overflow-hidden" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={(e) => e.stopPropagation()}>
                
                <div className={`p-4 text-white flex justify-between items-center ${adjustType === 'IN' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <h3 className="font-bold flex items-center gap-2">
                        {adjustType === 'IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        {adjustType === 'IN' ? 'Registrar Entrada' : 'Registrar Saída'}
                    </h3>
                    <button onClick={() => setIsAdjustModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                    <div className="text-center mb-4">
                        <p className="text-sm opacity-70" style={{ color: currentTheme.colors.textSecondary }}>Item</p>
                        <p className="font-bold text-lg" style={{ color: currentTheme.colors.text }}>{adjustItem.name}</p>
                        <p className="text-sm" style={{ color: currentTheme.colors.text }}>Saldo Atual: {adjustItem.quantity} {adjustItem.unit}</p>
                    </div>

                    <div>
                        <label className="block text-sm mb-1" style={labelStyle}>Quantidade *</label>
                        <input 
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={adjustData.quantity}
                            onChange={e => setAdjustData({...adjustData, quantity: parseFloat(e.target.value)})}
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1" style={labelStyle}>Motivo / Observação</label>
                        <input 
                            type="text"
                            value={adjustData.reason}
                            onChange={e => setAdjustData({...adjustData, reason: e.target.value})}
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            placeholder={adjustType === 'IN' ? "Ex: Compra Nota Fiscal 123" : "Ex: Uso na fundação"}
                        />
                    </div>

                    <div className="pt-2">
                        <Button 
                            type="submit" 
                            className="w-full"
                            isLoading={isLoading}
                            variant={adjustType === 'IN' ? 'primary' : 'danger'}
                        >
                            Confirmar {adjustType === 'IN' ? 'Entrada' : 'Saída'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}>
            <div className="w-full max-w-2xl rounded-2xl shadow-xl border relative flex flex-col max-h-[80vh]" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={(e) => e.stopPropagation()}>
                
                <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                            <History size={24} className="text-blue-500" />
                            Histórico de Movimentações
                        </h2>
                        <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                            {historyItemName} ({historyItemUnit})
                        </p>
                    </div>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: currentTheme.colors.textSecondary }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {historyLoading ? (
                        <div className="text-center py-8 opacity-60">Carregando histórico...</div>
                    ) : historyData.length === 0 ? (
                        <div className="text-center py-8 opacity-50" style={{ color: currentTheme.colors.text }}>
                            Nenhuma movimentação registrada.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historyData.map((mov, idx) => (
                                <div key={mov.id || idx} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${mov.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {mov.type === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: currentTheme.colors.text }}>
                                                {mov.type === 'IN' ? 'Entrada' : 'Saída'} de {mov.quantity}
                                            </p>
                                            <p className="text-xs opacity-60" style={{ color: currentTheme.colors.textSecondary }}>
                                                {new Date(mov.date).toLocaleString()} • Por: {mov.userName || 'Sistema'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {mov.reason && (
                                            <span className="text-xs px-2 py-1 rounded border opacity-70" style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}>
                                                {mov.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* CREATE/EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="w-full max-w-lg rounded-2xl shadow-xl border relative" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={(e) => e.stopPropagation()}>
             
            <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
                style={{ color: currentTheme.colors.textSecondary }}
            >
                <X size={20} />
            </button>

             <div className="p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
                <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
                    {editingId ? 'Editar Item da Obra' : 'Adicionar Insumo à Obra'}
                </h2>
                <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                    {editingId ? 'Ajuste o estoque atual ou limites.' : 'Selecione um insumo global para controlar nesta obra.'}
                </p>
             </div>

             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Global Item Selection - Only if adding new */}
                {!editingId && (
                    <div className="relative" ref={itemRef}>
                        <label className="block text-sm mb-1" style={labelStyle}>Selecione o Insumo *</label>
                        <div className="relative">
                            <input 
                                required
                                value={itemSearch}
                                onChange={e => {
                                    setItemSearch(e.target.value);
                                    setShowItemOptions(true);
                                    // If clearing search, clear selection
                                    if (!e.target.value) {
                                        setSelectedGlobalItem(null);
                                        setFormData(prev => ({ ...prev, originalItemId: '' }));
                                    }
                                }}
                                onFocus={() => setShowItemOptions(true)}
                                placeholder="Digite para buscar insumo..."
                                className={baseInputClass}
                                style={dynamicInputStyle}
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" style={{ color: currentTheme.colors.text }} />
                        </div>
                        
                        {showItemOptions && (
                            <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-xl" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                                {globalItems
                                    .filter(g => g.name.toLowerCase().includes(itemSearch.toLowerCase()) || g.category.toLowerCase().includes(itemSearch.toLowerCase()))
                                    .map(g => (
                                        <li 
                                            key={g.id}
                                            onMouseDown={() => {
                                                setSelectedGlobalItem(g);
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    originalItemId: g.id!,
                                                    averagePrice: g.unitValue || 0 
                                                }));
                                                setItemSearch(g.name);
                                                setShowItemOptions(false);
                                            }}
                                            className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-b last:border-0"
                                            style={{ borderColor: currentTheme.colors.border }}
                                        >
                                            <div className="font-medium" style={{ color: currentTheme.colors.text }}>{g.name}</div>
                                            <div className="text-xs opacity-60" style={{ color: currentTheme.colors.textSecondary }}>{g.category} • {g.unit}</div>
                                        </li>
                                    ))
                                }
                                {globalItems.filter(g => g.name.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 && (
                                    <li className="px-4 py-8 text-center text-sm opacity-50" style={{ color: currentTheme.colors.text }}>
                                        Nenhum insumo encontrado.
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                )}

                {/* Read-Only Info if item selected */}
                {selectedGlobalItem && (
                    <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-opacity-5" style={{ backgroundColor: currentTheme.isDark ? '#ffffff10' : '#00000005' }}>
                        <div>
                            <span className="text-xs opacity-70 block" style={{ color: currentTheme.colors.textSecondary }}>Categoria</span>
                            <span className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>{selectedGlobalItem.category}</span>
                        </div>
                        <div>
                            <span className="text-xs opacity-70 block" style={{ color: currentTheme.colors.textSecondary }}>Unidade</span>
                            <span className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>{selectedGlobalItem.unit}</span>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm mb-1" style={labelStyle}>Quantidade Inicial</label>
                    <input 
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                        className={baseInputClass}
                        style={dynamicInputStyle}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1" style={labelStyle}>Preço Médio (R$)</label>
                        <input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.averagePrice}
                            onChange={e => setFormData({...formData, averagePrice: parseFloat(e.target.value)})}
                            className={baseInputClass}
                            style={dynamicInputStyle}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1" style={labelStyle}>Estoque Mínimo</label>
                        <input 
                            type="number"
                            min="0"
                            value={formData.minThreshold}
                            onChange={e => setFormData({...formData, minThreshold: parseFloat(e.target.value)})}
                            className={baseInputClass}
                            style={dynamicInputStyle}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                    <Button type="submit">{editingId ? 'Salvar Alterações' : 'Adicionar ao Estoque'}</Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ObraInventory;
