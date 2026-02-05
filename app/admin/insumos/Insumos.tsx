import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { inventoryService } from '../../../services/inventoryService';
import { InventoryItem } from '../../../types';
import { Plus, Search, Package, Info, LayoutList, LayoutGrid, Edit, Trash2, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';

// Options Constants
const COST_TYPES = [
  "Equipamentos",
  "Fretes",
  "Mão de obra",
  "Materiais",
  "Outros",
  "Serviço"
];

const MEASUREMENT_UNITS = [
  "Unidade (un)",
  "Quilograma (kg)",
  "Grama (g)",
  "Metro (m)",
  "Metro Quadrado (m²)",
  "Metro Cúbico (m³)",
  "Litro (l)",
  "Caixa (cx)",
  "Par (par)",
  "Tonelada (ton)",
  "Saca (sc)",
  "Hora (h)",
  "Dia (d)",
  "Verba (vb)"
];

const InsumosPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list'); // Default to list
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const fetchItems = async () => {
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  useEffect(() => {
    fetchItems();
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este insumo?')) {
      try {
        await inventoryService.delete(id);
        fetchItems();
      } catch (error) {
        console.error("Error deleting item", error);
        alert("Erro ao excluir item.");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
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

      const itemData = {
        code: formData.code,
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
      fetchItems();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar insumo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic Input Style
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  // Select Option Style to ensure readability in dropdowns
  const optionStyle = {
    backgroundColor: currentTheme.colors.card,
    color: currentTheme.colors.text
  };

  // Base class for inputs to handle shape/focus
  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";

  // Dynamic Label Style
  const labelStyle = { color: currentTheme.colors.text };

  return (
    <AdminLayout pageTitle="Insumos">
      
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
              onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Content Area */}
      {filteredItems.length === 0 ? (
        <div className="col-span-full py-12 text-center opacity-60">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.text }} />
            <p style={{ color: currentTheme.colors.text }}>Nenhum insumo encontrado.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            // LIST VIEW (Table)
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
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
                  {filteredItems.map((item, index) => {
                    const totalValue = (item.quantity || 0) * (item.unitValue || 0);
                    const isEven = index % 2 === 0;
                    
                    // Zebra Striping Logic
                    const rowBackground = isEven 
                        ? 'transparent' // Main background
                        : currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'; // Slightly lighter/darker

                    return (
                      <tr 
                        key={item.id} 
                        className="group hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: rowBackground }}
                      >
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
                                onClick={() => handleDelete(item.id!)}
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
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-5 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md relative group"
                  style={{ 
                    backgroundColor: currentTheme.colors.card, 
                    borderColor: currentTheme.colors.border 
                  }}
                >
                  {/* Card Actions */}
                  <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleEdit(item)} className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600">
                        <Edit size={14} />
                     </button>
                     <button onClick={() => handleDelete(item.id!)} className="p-1.5 rounded bg-red-500 text-white hover:bg-red-600">
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div 
            className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border relative"
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
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-1">
                   <div className="w-full">
                      <label className="block text-sm font-medium mb-1" style={labelStyle}>Código</label>
                      <input 
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="0001"
                        className={baseInputClass}
                        style={dynamicInputStyle}
                      />
                   </div>
                 </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1">
                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Nome *</label>
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    />
                 </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Categoria *</label>
                    <input 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Selecione..."
                      required
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    />
                 </div>

                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Tipo custo *</label>
                    <select
                      name="costType"
                      value={formData.costType}
                      onChange={handleInputChange}
                      required
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    >
                      <option value="" disabled style={optionStyle}>Selecione...</option>
                      {COST_TYPES.map(type => (
                        <option key={type} value={type} style={optionStyle}>{type}</option>
                      ))}
                    </select>
                 </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="w-full">
                    <label className="block text-sm font-medium mb-1" style={labelStyle}>Und. orçamento *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      className={baseInputClass}
                      style={dynamicInputStyle}
                    >
                      <option value="" disabled style={optionStyle}>Selecione...</option>
                      {MEASUREMENT_UNITS.map(unit => (
                        <option key={unit} value={unit} style={optionStyle}>{unit}</option>
                      ))}
                    </select>
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

    </AdminLayout>
  );
};

export default InsumosPage;