import React, { useEffect, useState, useRef } from 'react';
import { inventoryService } from '../../../services/inventoryService';
import { settingsService } from '../../../services/settingsService';
import { InventoryItem, MeasurementUnit, ItemCategory } from '../../../types';
import { Plus, Search, Package, Info, LayoutList, LayoutGrid, Edit, Trash2, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

// Options Constants
const COST_TYPES = [
  "Equipamentos",
  "Fretes",
  "Mão de obra",
  "Materiais",
  "Outros",
  "Serviço"
];

const InsumosPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Dynamic Options State
  const [availableUnits, setAvailableUnits] = useState<MeasurementUnit[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ItemCategory[]>([]);

  // Combobox State
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showCostTypeOptions, setShowCostTypeOptions] = useState(false);
  const [showUnitOptions, setShowUnitOptions] = useState(false);

  // Refs for Click Outside Logic
  const categoryRef = useRef<HTMLDivElement>(null);
  const costTypeRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form State
  const initialFormState: Partial<InventoryItem> = {
    code: '',
    name: '',
    category: '',
    costType: '',
    unit: '', // Und. orçamento
    unitValue: 0,
    stockControl: false,
    minThreshold: 0,
    quantity: 0
  };

  const [formData, setFormData] = useState<Partial<InventoryItem>>(initialFormState);

  const fetchData = async () => {
    try {
      const [inventoryData, unitsData, categoriesData] = await Promise.all([
        inventoryService.getAll(),
        settingsService.getUnits(),
        settingsService.getCategories()
      ]);
      setItems(inventoryData);
      setAvailableUnits(unitsData);
      setAvailableCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Click Outside Listener to close dropdowns correctly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryOptions(false);
      }
      if (costTypeRef.current && !costTypeRef.current.contains(event.target as Node)) {
        setShowCostTypeOptions(false);
      }
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setShowUnitOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Standard handling for non-currency fields
    const finalValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  // Currency Mask Handler
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const amount = rawValue ? parseFloat(rawValue) / 100 : 0;
    setFormData(prev => ({ ...prev, unitValue: amount }));
  };

  const handleStockControlChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, stockControl: value }));
  };

  // --- Quick Add Handlers ---

  const handleQuickAddCategory = async () => {
    const newCategoryName = formData.category?.trim();
    if (!newCategoryName) return;

    // Check if exists
    const exists = availableCategories.find(c => c.category.toLowerCase() === newCategoryName.toLowerCase());
    if (exists) {
        setFormData(prev => ({ ...prev, category: exists.category })); // Normalize case
        setShowCategoryOptions(false);
        return;
    }

    if (window.confirm(`Deseja cadastrar a nova categoria "${newCategoryName}"?`)) {
        try {
            await settingsService.addCategory({
                category: newCategoryName,
                subcategory: '',
                type: 'Produto', // Default
                registrationType: 'Próprio'
            });
            // Refresh list
            const updatedCats = await settingsService.getCategories();
            setAvailableCategories(updatedCats);
            setShowCategoryOptions(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar categoria rápida.");
        }
    }
  };

  const handleQuickAddUnit = async () => {
    const newUnitName = formData.unit?.trim();
    if (!newUnitName) return;

    // Check if exists
    const exists = availableUnits.find(u => u.name.toLowerCase() === newUnitName.toLowerCase() || u.abbreviation.toLowerCase() === newUnitName.toLowerCase());
    if (exists) {
        setFormData(prev => ({ ...prev, unit: exists.abbreviation })); // Normalize
        setShowUnitOptions(false);
        return;
    }

    const abbr = prompt(`Informe a abreviação para "${newUnitName}" (ex: UN, kg, m):`);
    if (abbr) {
        try {
            await settingsService.addUnit({
                name: newUnitName,
                abbreviation: abbr.toUpperCase()
            });
            // Refresh list
            const updatedUnits = await settingsService.getUnits();
            setAvailableUnits(updatedUnits);
            setFormData(prev => ({ ...prev, unit: abbr.toUpperCase() })); 
            setShowUnitOptions(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar unidade rápida.");
        }
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      code: item.code || '',
      name: item.name,
      category: item.category,
      costType: item.costType || '',
      unit: item.unit,
      unitValue: item.unitValue || 0,
      stockControl: item.stockControl,
      minThreshold: item.minThreshold,
      quantity: item.quantity
    });
    setEditingId(item.id!);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
      await inventoryService.delete(deleteId);
      await fetchData(); // Refresh list
      setDeleteId(null);
      // Remove from selection if present
      const newSelection = new Set(selectedIds);
      newSelection.delete(deleteId);
      setSelectedIds(newSelection);
    } catch (error) {
      console.error("Error deleting item", error);
      alert("Erro ao excluir item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    setShowCategoryOptions(false);
    setShowCostTypeOptions(false);
    setShowUnitOptions(false);
  };

  const generateCode = () => {
    // Generates a simple random 6-digit code with prefix
    return `INS-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required
      if (!formData.name || !formData.category || !formData.unit || !formData.costType) {
        alert("Preencha os campos obrigatórios (*)");
        setIsLoading(false);
        return;
      }

      // Auto-generate code if creating new
      const codeToUse = editingId ? formData.code : generateCode();

      const itemData = {
        code: codeToUse,
        name: formData.name!,
        category: formData.category!,
        costType: formData.costType,
        unit: formData.unit!,
        unitValue: formData.unitValue || 0,
        stockControl: formData.stockControl || false,
        minThreshold: formData.minThreshold || 0,
        quantity: formData.quantity || 0
      };

      if (editingId) {
        await inventoryService.update(editingId, itemData);
      } else {
        await inventoryService.add(itemData as InventoryItem);
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar insumo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Código", "Nome", "Categoria", "Tipo de Custo", "Unidade", "Qtd. Atual", "Valor Unit.", "Estoque Min."];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + items.map(i => `${i.code || ''},${i.name},${i.category},${i.costType},${i.unit},${i.quantity},${i.unitValue},${i.minThreshold}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "insumos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    alert("Funcionalidade de importação de insumos em massa via Excel será implementada em breve.");
  };

  // --- Multi-Selection Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIdsOnPage = currentData.map(item => item.id!);
      const newSelection = new Set(selectedIds);
      allIdsOnPage.forEach(id => newSelection.add(id));
      setSelectedIds(newSelection);
    } else {
      const newSelection = new Set(selectedIds);
      currentData.forEach(item => newSelection.delete(item.id!));
      setSelectedIds(newSelection);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds) as string[];
    if (idsToDelete.length === 0) return;

    if (!window.confirm(`Tem certeza que deseja excluir ${idsToDelete.length} itens?`)) return;
    
    setIsDeletingMultiple(true);
    try {
      await Promise.all(idsToDelete.map(id => inventoryService.delete(id)));
      setSelectedIds(new Set());
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const currentData = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Check if all on current page are selected
  const isAllSelected = currentData.length > 0 && currentData.every(item => selectedIds.has(item.id!));

  // Dynamic Input Style
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const labelStyle = { color: currentTheme.colors.text };

  // Helper for filtered dropdown options
  const filteredCategories = availableCategories.filter(c => 
    c.category.toLowerCase().includes((formData.category || '').toLowerCase())
  );
  
  const filteredUnits = availableUnits.filter(u => 
    u.name.toLowerCase().includes((formData.unit || '').toLowerCase()) ||
    u.abbreviation.toLowerCase().includes((formData.unit || '').toLowerCase())
  );

  const filteredCostTypes = COST_TYPES.filter(t => 
    t.toLowerCase().includes((formData.costType || '').toLowerCase())
  );

  // Determine if we need to show quick add for Category
  const showQuickAddCategory = formData.category && !filteredCategories.some(c => c.category.toLowerCase() === formData.category?.toLowerCase());

  // Determine if we need to show quick add for Unit
  const showQuickAddUnit = formData.unit && !filteredUnits.some(u => u.name.toLowerCase() === formData.unit?.toLowerCase() || u.abbreviation.toLowerCase() === formData.unit?.toLowerCase());

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
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
          
          {/* View Toggles */}
          <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: currentTheme.colors.border }}>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-opacity-100' : 'bg-opacity-0 hover:bg-opacity-10'}`}
                style={{ 
                  backgroundColor: viewMode === 'list' ? currentTheme.colors.primary : 'transparent',
                  color: viewMode === 'list' ? '#fff' : currentTheme.colors.text
                }}
             >
                <LayoutList size={20} />
             </button>
             <div className="w-px h-full" style={{ backgroundColor: currentTheme.colors.border }}></div>
             <button 
                onClick={() => setViewMode('card')}
                className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-opacity-100' : 'bg-opacity-0 hover:bg-opacity-10'}`}
                style={{ 
                  backgroundColor: viewMode === 'card' ? currentTheme.colors.primary : 'transparent',
                  color: viewMode === 'card' ? '#fff' : currentTheme.colors.text
                }}
             >
                <LayoutGrid size={20} />
             </button>
          </div>
        </div>

        <Button 
          onClick={() => {
            setFormData(initialFormState);
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Insumo
        </Button>
      </div>

      {/* Content Area - Padding bottom for fixed footer */}
      <div className="pb-20">
        {currentData.length === 0 ? (
          <div className="col-span-full py-12 text-center opacity-60">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.text }} />
              <p style={{ color: currentTheme.colors.text }}>Nenhum insumo encontrado.</p>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              // LIST VIEW (Table)
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
                <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                  <thead>
                    <tr className="" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                      <th className="p-4 w-10 text-center">
                        <input 
                           type="checkbox" 
                           checked={isAllSelected}
                           onChange={handleSelectAll}
                           className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </th>
                      <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Código</th>
                      <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Insumo</th>
                      <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Unidade</th>
                      <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Qtd. atual</th>
                      <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Preço médio</th>
                      <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Total</th>
                      <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Qtd. mínima</th>
                      <th className="p-4 font-medium text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((item, index) => {
                      const totalValue = (item.quantity || 0) * (item.unitValue || 0);
                      const isEven = index % 2 === 0;
                      const isSelected = selectedIds.has(item.id!);
                      
                      const rowBackground = isSelected 
                          ? (currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff')
                          : isEven ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');

                      return (
                        <tr 
                          key={item.id} 
                          className="group hover:opacity-80 transition-colors"
                          style={{ backgroundColor: rowBackground }}
                        >
                          <td className="p-4 text-center">
                             <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleSelectOne(item.id!)}
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                             />
                          </td>
                          <td className="p-4 whitespace-nowrap" style={{ color: currentTheme.colors.textSecondary }}>
                             {item.code || '-'}
                          </td>
                          <td className="p-4" style={{ color: currentTheme.colors.text }}>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs opacity-70">{item.category}</div>
                          </td>
                          <td className="p-4 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>{item.unit}</td>
                          <td className="p-4 text-right whitespace-nowrap font-medium" style={{ color: currentTheme.colors.text }}>
                            {item.quantity?.toFixed(4)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                            {formatCurrency(item.unitValue)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap font-medium" style={{ color: currentTheme.colors.text }}>
                            {formatCurrency(totalValue)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                            {item.stockControl ? item.minThreshold?.toFixed(4) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2">
                               <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                                  title="Editar"
                               >
                                 <Edit size={16} />
                               </button>
                               <button 
                                  onClick={() => handleDeleteClick(item.id!)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                                  title="Excluir"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // CARD VIEW
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md relative group"
                    style={{ 
                      backgroundColor: currentTheme.colors.card, 
                      borderColor: currentTheme.colors.border 
                    }}
                  >
                    {/* Selection Overlay for Cards (optional, keeping simple for now) */}
                    
                    {/* Card Actions */}
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEdit(item)} className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600">
                          <Edit size={14} />
                       </button>
                       <button onClick={() => handleDeleteClick(item.id!)} className="p-1.5 rounded bg-red-500 text-white hover:bg-red-600">
                          <Trash2 size={14} />
                       </button>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${currentTheme.colors.primary}20` }}>
                        <Package className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.textSecondary }}>
                        {item.code || 'S/ Cód'}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg mb-1 pr-6" style={{ color: currentTheme.colors.text }}>{item.name}</h3>
                      <p className="text-xs mb-3" style={{ color: currentTheme.colors.textSecondary }}>{item.category}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-4 pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
                         <div>
                            <p className="text-xs opacity-70 mb-1" style={{ color: currentTheme.colors.textSecondary }}>Unidade</p>
                            <p style={{ color: currentTheme.colors.text }}>{item.unit}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs opacity-70 mb-1" style={{ color: currentTheme.colors.textSecondary }}>Estoque Mín.</p>
                            <p style={{ color: currentTheme.colors.text }}>{item.stockControl ? item.minThreshold : '-'}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <BottomActionsBar 
        totalItems={filteredItems.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onImport={handleImport}
        onExport={handleExport}
        
        // Bulk props
        selectedCount={selectedIds.size}
        onDeleteSelected={handleBulkDelete}
        onCancelSelection={() => setSelectedIds(new Set())}
        isDeleting={isDeletingMultiple}
      />

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border relative mx-4"
            style={{ 
              backgroundColor: currentTheme.colors.card, 
              borderColor: currentTheme.colors.border 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button X */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
              <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Insumo' : 'Cadastro de Insumo'}
              </h2>
              <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                {editingId ? 'Atualize os dados do material' : 'Preencha os dados do novo material'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Row 2 - Name only since Code is auto */}
              <div className="grid grid-cols-1">
                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Nome *</label>
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Cimento CP-II"
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    />
                 </div>
              </div>

              {/* Row 3 - Category with Custom Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="w-full relative" ref={categoryRef}>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Categoria *</label>
                    <div className="relative">
                        <input
                            name="category"
                            value={formData.category}
                            onChange={(e) => {
                                handleInputChange(e);
                                setShowCategoryOptions(true);
                            }}
                            onFocus={() => setShowCategoryOptions(true)}
                            placeholder="Selecione ou digite..."
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            autoComplete="off"
                            required
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                    </div>
                    
                    {showCategoryOptions && (
                        <ul 
                            className="absolute z-[100] w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg"
                            style={{ 
                                backgroundColor: currentTheme.colors.card, 
                                borderColor: currentTheme.colors.border 
                            }}
                        >
                            {/* Quick Add Option - Always show if typed text is not empty and exact match not found */}
                            {showQuickAddCategory && (
                                <li 
                                    onMouseDown={handleQuickAddCategory}
                                    className="px-3 py-2 cursor-pointer border-b font-medium transition-colors hover:bg-opacity-10"
                                    style={{ 
                                        color: currentTheme.colors.primary, 
                                        borderColor: currentTheme.colors.border,
                                        backgroundColor: `${currentTheme.colors.primary}10`
                                    }}
                                >
                                    + Cadastrar "{formData.category}"
                                </li>
                            )}
                            
                            {/* Existing Options */}
                            {filteredCategories.map(cat => (
                                <li 
                                    key={cat.id} 
                                    onMouseDown={() => {
                                        setFormData(prev => ({ ...prev, category: cat.category }));
                                        setShowCategoryOptions(false);
                                    }}
                                    className="px-3 py-2 cursor-pointer transition-colors"
                                    // Custom Hover Style
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}15`;
                                        e.currentTarget.style.color = currentTheme.colors.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = currentTheme.colors.text;
                                    }}
                                    style={{ color: currentTheme.colors.text }}
                                >
                                    {cat.category} {cat.subcategory ? `- ${cat.subcategory}` : ''}
                                </li>
                            ))}
                            
                            {filteredCategories.length === 0 && !showQuickAddCategory && (
                                <li className="px-3 py-2 text-sm opacity-50" style={{ color: currentTheme.colors.text }}>Digite para buscar...</li>
                            )}
                        </ul>
                    )}
                 </div>

                 <div className="w-full relative" ref={costTypeRef}>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Tipo custo *</label>
                    <div className="relative">
                        <input
                            name="costType"
                            value={formData.costType}
                            onChange={(e) => {
                                handleInputChange(e);
                                setShowCostTypeOptions(true);
                            }}
                            onFocus={() => setShowCostTypeOptions(true)}
                            placeholder="Selecione..."
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            autoComplete="off"
                            required
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                    </div>

                    {showCostTypeOptions && (
                        <ul 
                            className="absolute z-[100] w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg"
                            style={{ 
                                backgroundColor: currentTheme.colors.card, 
                                borderColor: currentTheme.colors.border 
                            }}
                        >
                            {filteredCostTypes.map(type => (
                                <li 
                                    key={type} 
                                    onMouseDown={() => {
                                        setFormData(prev => ({ ...prev, costType: type }));
                                        setShowCostTypeOptions(false);
                                    }}
                                    className="px-3 py-2 cursor-pointer transition-colors"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}15`;
                                        e.currentTarget.style.color = currentTheme.colors.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = currentTheme.colors.text;
                                    }}
                                    style={{ color: currentTheme.colors.text }}
                                >
                                    {type}
                                </li>
                            ))}
                             {filteredCostTypes.length === 0 && (
                                <li className="px-3 py-2 text-sm opacity-50" style={{ color: currentTheme.colors.text }}>Nenhum encontrado...</li>
                            )}
                        </ul>
                    )}
                 </div>
              </div>

              {/* Row 4 - Unit with Custom Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="w-full relative" ref={unitRef}>
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Und. orçamento *</label>
                    <div className="relative">
                        <input
                            name="unit"
                            value={formData.unit}
                            onChange={(e) => {
                                handleInputChange(e);
                                setShowUnitOptions(true);
                            }}
                            onFocus={() => setShowUnitOptions(true)}
                            placeholder="Selecione ou digite..."
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            autoComplete="off"
                            required
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                    </div>

                    {showUnitOptions && (
                        <ul 
                            className="absolute z-[100] w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg"
                            style={{ 
                                backgroundColor: currentTheme.colors.card, 
                                borderColor: currentTheme.colors.border 
                            }}
                        >
                            {/* Quick Add Option */}
                            {showQuickAddUnit && (
                                <li 
                                    onMouseDown={handleQuickAddUnit}
                                    className="px-3 py-2 cursor-pointer border-b font-medium transition-colors hover:bg-opacity-10"
                                    style={{ 
                                        color: currentTheme.colors.primary, 
                                        borderColor: currentTheme.colors.border,
                                        backgroundColor: `${currentTheme.colors.primary}10`
                                    }}
                                >
                                    + Cadastrar "{formData.unit}"
                                </li>
                            )}

                            {filteredUnits.map(unit => (
                                <li 
                                    key={unit.id} 
                                    onMouseDown={() => {
                                        setFormData(prev => ({ ...prev, unit: unit.abbreviation }));
                                        setShowUnitOptions(false);
                                    }}
                                    className="px-3 py-2 cursor-pointer transition-colors"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}15`;
                                        e.currentTarget.style.color = currentTheme.colors.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = currentTheme.colors.text;
                                    }}
                                    style={{ color: currentTheme.colors.text }}
                                >
                                    {unit.name} ({unit.abbreviation})
                                </li>
                            ))}
                        </ul>
                    )}
                 </div>

                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Vlr. unitário</label>
                    <input 
                      name="unitValue"
                      type="text"
                      inputMode="numeric"
                      value={formData.unitValue ? formatCurrency(formData.unitValue) : ''}
                      onChange={handleCurrencyChange}
                      placeholder="R$ 0,00"
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    />
                 </div>
              </div>

              {/* Row 5: Radio & Min Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                   <label className="block text-sm font-medium mb-2" style={labelStyle}>
                     Controle de estoque
                   </label>
                   <div className="flex space-x-6 pt-2">
                     <label className="inline-flex items-center cursor-pointer">
                       <input 
                         type="radio" 
                         name="stockControl"
                         checked={formData.stockControl === false}
                         onChange={() => handleStockControlChange(false)}
                         className="form-radio h-4 w-4"
                         style={{ accentColor: currentTheme.colors.primary }}
                       />
                       <span className="ml-2 text-sm" style={{ color: currentTheme.colors.text }}>Não</span>
                     </label>
                     <label className="inline-flex items-center cursor-pointer">
                       <input 
                         type="radio" 
                         name="stockControl"
                         checked={formData.stockControl === true}
                         onChange={() => handleStockControlChange(true)}
                         className="form-radio h-4 w-4"
                         style={{ accentColor: currentTheme.colors.primary }}
                       />
                       <span className="ml-2 text-sm" style={{ color: currentTheme.colors.text }}>Sim</span>
                     </label>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium mb-1 flex items-center" style={labelStyle}>
                     Qtd. mínima estoque
                     <Info className="h-3 w-3 ml-2 text-gray-400" />
                   </label>
                   <input
                     type="number"
                     name="minThreshold"
                     value={formData.minThreshold}
                     onChange={handleInputChange}
                     disabled={!formData.stockControl}
                     className={`${baseInputClass} ${!formData.stockControl ? 'opacity-50 cursor-not-allowed' : ''}`}
                     style={dynamicInputStyle}
                   />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: currentTheme.colors.border }}>
                 <Button 
                   type="button" 
                   variant="secondary" 
                   onClick={handleCloseModal}
                   style={{ 
                     backgroundColor: 'transparent', 
                     color: currentTheme.colors.text,
                     borderColor: currentTheme.colors.border 
                   }}
                 >
                   Cancelar
                 </Button>
                 
                 <Button 
                   type="submit" 
                   isLoading={isLoading} 
                   style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }} 
                 >
                   {editingId ? 'Atualizar Insumo' : 'Salvar Insumo'}
                 </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <div 
            className="w-full max-w-sm rounded-xl shadow-xl border p-6 text-center animate-in zoom-in-95 duration-200"
            style={{ 
              backgroundColor: currentTheme.colors.card, 
              borderColor: currentTheme.colors.border 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h3 className="text-lg font-bold mb-2" style={{ color: currentTheme.colors.text }}>Confirmar Exclusão</h3>
            <p className="text-sm mb-6 opacity-80" style={{ color: currentTheme.colors.textSecondary }}>
              Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteId(null)}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                isLoading={isLoading}
                className="w-full"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default InsumosPage;