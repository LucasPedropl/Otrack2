import React, { useEffect, useState, useRef } from 'react';
import { settingsService } from '../../../services/settingsService';
import { ItemCategory } from '../../../types';
import { Plus, Search, Tag, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const CategoriasPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Edit/Create State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ItemCategory, 'id'>>({ 
    type: 'Produto', 
    category: '', 
    subcategory: '', 
    registrationType: 'Padrão' 
  });

  const fetchCategories = async () => {
    try {
      const data = await settingsService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (cat: ItemCategory) => {
    // Restriction removed
    setFormData({
       type: cat.type,
       category: cat.category,
       subcategory: cat.subcategory,
       registrationType: cat.registrationType
    });
    setEditingId(cat.id!);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    // Restriction removed
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
        await settingsService.deleteCategory(deleteId);
        const newSelection = new Set(selectedIds);
        newSelection.delete(deleteId);
        setSelectedIds(newSelection);
        fetchCategories();
        setDeleteId(null);
    } catch (error) {
        console.error("Error deleting category", error);
        alert("Erro ao excluir categoria.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
         await settingsService.updateCategory(editingId, formData);
      } else {
         await settingsService.addCategory(formData);
      }
      setIsModalOpen(false);
      setFormData({ type: 'Produto', category: '', subcategory: '', registrationType: 'Padrão' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
     setIsModalOpen(false);
     setFormData({ type: 'Produto', category: '', subcategory: '', registrationType: 'Padrão' });
     setEditingId(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.type === "application/pdf") {
      alert("A importação de PDF requer um processamento de OCR avançado. Por favor, utilize um arquivo Excel (.xlsx) ou CSV para uma importação precisa e imediata.");
      return;
    }

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = window.XLSX.read(arrayBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = window.XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        throw new Error("Planilha vazia ou formato inválido");
      }

      let count = 0;
      for (const row of data) {
         const type = row['Tipo'] || row['TIPO'] || 'Produto';
         const category = row['Categoria'] || row['CATEGORIA'];
         const sub = row['Subcategoria'] || row['SUBCATEGORIA'] || '';
         const reg = row['Cadastro'] || row['CADASTRO'] || 'Padrão';

         if (category) {
           await settingsService.addCategory({
             type: type as any,
             category: String(category).trim(),
             subcategory: String(sub).trim(),
             registrationType: reg as any
           });
           count++;
         }
      }

      alert(`${count} categorias importadas com sucesso!`);
      fetchCategories();

    } catch (error) {
      console.error("Import error:", error);
      alert("Erro ao importar arquivo. Verifique se é um Excel/CSV válido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Tipo", "Categoria", "Subcategoria", "Cadastro"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + categories.map(c => `${c.type},${c.category},${c.subcategory},${c.registrationType}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "categorias_insumo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} itens?`)) return;
    
    setIsDeletingMultiple(true);
    try {
      // Logic simplified: No more filtering of default- ids
      await Promise.all(Array.from(selectedIds).map((id: string) => settingsService.deleteCategory(id)));
      setSelectedIds(new Set());
      fetchCategories();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const filteredData = categories.filter(c => 
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = currentData.length > 0 && currentData.every(item => selectedIds.has(item.id!));

  return (
    <>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        accept=".xlsx, .xls, .csv, .pdf"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoria..."
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
            setFormData({ type: 'Produto', category: '', subcategory: '', registrationType: 'Padrão' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 w-10 text-center">
                    <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                </th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Tipo</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Categoria</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Subcategoria</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Cadastro</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="p-8 text-center opacity-50">
                      <Tag className="h-8 w-8 mx-auto mb-2" />
                      Nenhuma categoria encontrada.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => {
                  const isSelected = selectedIds.has(item.id!);
                  const rowBackground = isSelected 
                      ? (currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff')
                      : index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');

                  return (
                    <tr 
                        key={item.id}
                        className="group hover:opacity-80 transition-opacity"
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
                        <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Produto' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {item.type}
                        </span>
                        </td>
                        <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>{item.category}</td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>{item.subcategory || '-'}</td>
                        <td className="p-4" style={{ color: currentTheme.colors.text }}>{item.registrationType}</td>
                        <td className="p-4 text-center">
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
        onImport={handleImportClick}
        onExport={handleExport}
        isImporting={isLoading}
        selectedCount={selectedIds.size}
        onDeleteSelected={handleBulkDelete}
        onCancelSelection={() => setSelectedIds(new Set())}
        isDeleting={isDeletingMultiple}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <h2 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Tipo</label>
                       <select
                         value={formData.type}
                         onChange={e => setFormData({...formData, type: e.target.value as any})}
                         className="w-full p-2 rounded border"
                         style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                       >
                         <option value="Produto">Produto</option>
                         <option value="Serviço">Serviço</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Cadastro</label>
                       <select
                         value={formData.registrationType}
                         onChange={e => setFormData({...formData, registrationType: e.target.value as any})}
                         className="w-full p-2 rounded border"
                         style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                       >
                         <option value="Padrão">Padrão</option>
                         <option value="Próprio">Próprio</option>
                       </select>
                   </div>
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Categoria</label>
                   <input 
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     className="w-full p-2 rounded border"
                     required
                     placeholder="Ex: Acabamentos"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Subcategoria</label>
                   <input 
                     value={formData.subcategory}
                     onChange={e => setFormData({...formData, subcategory: e.target.value})}
                     className="w-full p-2 rounded border"
                     placeholder="Ex: Pisos, Azulejos..."
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                   <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                   <Button type="submit">{editingId ? 'Atualizar' : 'Salvar'}</Button>
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
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
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

export default CategoriasPage;