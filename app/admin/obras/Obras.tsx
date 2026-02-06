import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { constructionService } from '../../../services/constructionService';
import { ConstructionSite } from '../../../types';
import { Plus, Search, Building2, Edit, Trash2, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';

const ObrasPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');

  const fetchSites = async () => {
    try {
      const data = await constructionService.getAll();
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch construction sites", error);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleEdit = (site: ConstructionSite) => {
    setName(site.name);
    setEditingId(site.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta obra?')) {
      try {
        await constructionService.delete(id);
        fetchSites();
      } catch (error) {
        console.error("Error deleting site", error);
        alert("Erro ao excluir obra.");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name.trim()) {
        alert("O nome da obra é obrigatório.");
        setIsLoading(false);
        return;
      }

      if (editingId) {
        await constructionService.update(editingId, name);
      } else {
        await constructionService.add(name);
      }

      handleCloseModal();
      fetchSites();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar obra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic Input Style
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const labelStyle = { color: currentTheme.colors.text };

  return (
    <AdminLayout pageTitle="Obras">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obra..."
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
        </div>

        <Button 
          onClick={() => {
            setName('');
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
      </div>

      {/* Content Area */}
      {filteredSites.length === 0 ? (
        <div className="col-span-full py-12 text-center opacity-60">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.text }} />
            <p style={{ color: currentTheme.colors.text }}>Nenhuma obra encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome da Obra</th>
                <th className="p-4 font-medium w-32 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site, index) => {
                const isEven = index % 2 === 0;
                const rowBackground = isEven 
                    ? 'transparent' 
                    : currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

                return (
                  <tr 
                    key={site.id} 
                    className="group hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: rowBackground }}
                  >
                    <td className="p-4" style={{ color: currentTheme.colors.text }}>
                      <div className="font-medium text-base">{site.name}</div>
                      <div className="text-xs opacity-50">Criado em {site.createdAt.toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEdit(site)}
                            className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(site.id!)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div 
            className="w-full max-w-lg rounded-2xl shadow-2xl border relative"
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
                {editingId ? 'Editar Obra' : 'Nova Obra'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="w-full">
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Nome da Obra *</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Residencial Flores"
                  className={baseInputClass}
                  style={dynamicInputStyle}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-2">
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
                   {editingId ? 'Atualizar' : 'Salvar'}
                 </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default ObrasPage;