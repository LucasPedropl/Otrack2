import React, { useEffect, useState } from 'react';
import { settingsService } from '../../../services/settingsService';
import { ItemCategory } from '../../../types';
import { Plus, Search, Tag, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const CategoriasPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    if (cat.id?.startsWith('default-')) {
       alert("Este é um item padrão de demonstração. Importe a lista para poder editar.");
       return;
    }
    setFormData({
       type: cat.type,
       category: cat.category,
       subcategory: cat.subcategory,
       registrationType: cat.registrationType
    });
    setEditingId(cat.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default-')) {
       alert("Não é possível excluir itens padrão do sistema (mock). Importe os dados para editar.");
       return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await settingsService.deleteCategory(id);
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category", error);
        alert("Erro ao excluir categoria.");
      }
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

  const handleImport = async () => {
    if(window.confirm("Isso importará a lista padrão completa de categorias. Deseja continuar?")) {
      setIsLoading(true);
      try {
        await settingsService.importDefaultCategories();
        alert("Importação concluída com sucesso!");
        fetchCategories();
      } catch (error) {
        console.error(error);
        alert("Erro na importação.");
      } finally {
        setIsLoading(false);
      }
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

  const filteredData = categories.filter(c => 
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
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

      {/* Table Container with padding for fixed footer */}
      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
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
                   <td colSpan={5} className="p-8 text-center opacity-50">
                      <Tag className="h-8 w-8 mx-auto mb-2" />
                      Nenhuma categoria encontrada.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr 
                    key={item.id}
                    className="group hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                  >
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
                          onClick={() => handleDelete(item.id!)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <BottomActionsBar 
        totalItems={filteredData.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onImport={handleImport}
        onExport={handleExport}
        isImporting={isLoading}
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
    </>
  );
};

export default CategoriasPage;