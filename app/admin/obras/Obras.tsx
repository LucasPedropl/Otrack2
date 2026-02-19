
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { constructionService } from '../../../services/constructionService';
import { ConstructionSite } from '../../../types';
import { Plus, Search, Building2, Edit, Trash2, X, LayoutList, LayoutGrid, FolderDot, Calendar, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { useConstructionSites } from '../../../contexts/ConstructionSiteContext';

const ObrasPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const { hasPermission } = usePermissions();
  const { sites, refreshSites } = useConstructionSites(); // Usando Contexto
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Modal
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card'); 

  // Form State
  const [name, setName] = useState('');

  // Ao montar, garante que os dados estão atualizados (opcional, pois o provider já carrega)
  useEffect(() => {
    refreshSites();
  }, [refreshSites]);

  const handleNavigate = (id: string) => {
    navigate(`/admin/obra/${id}`);
  };

  const handleEdit = (e: React.MouseEvent, site: ConstructionSite) => {
    e.preventDefault();
    e.stopPropagation(); 
    setName(site.name);
    setEditingId(site.id!);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    setIsDeleting(true);
    try {
      await constructionService.delete(deleteConfirmationId);
      await refreshSites();
      setDeleteConfirmationId(null);
    } catch (error) {
      console.error("Error deleting site", error);
      alert("Erro ao excluir obra.");
    } finally {
      setIsDeleting(false);
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
      await refreshSites(); // Atualiza contexto
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
    <>
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

          {/* View Toggles */}
          <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: currentTheme.colors.border }}>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-opacity-100' : 'bg-opacity-0 hover:bg-opacity-10'}`}
                style={{ 
                  backgroundColor: viewMode === 'list' ? currentTheme.colors.primary : 'transparent',
                  color: viewMode === 'list' ? '#fff' : currentTheme.colors.text
                }}
                title="Visualização em Lista"
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
                title="Visualização em Grade"
             >
                <LayoutGrid size={20} />
             </button>
          </div>
        </div>

        {hasPermission('obras', 'create') && (
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
        )}
      </div>

      {/* Content Area */}
      {filteredSites.length === 0 ? (
        <div className="col-span-full py-12 text-center opacity-60">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.text }} />
            <p style={{ color: currentTheme.colors.text }}>Nenhuma obra encontrada.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            // LIST VIEW
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                    <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome da Obra</th>
                    <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data de Criação</th>
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
                        onClick={() => handleNavigate(site.id!)}
                        className="group hover:opacity-80 transition-opacity cursor-pointer"
                        style={{ backgroundColor: rowBackground }}
                      >
                        <td className="p-4" style={{ color: currentTheme.colors.text }}>
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${currentTheme.colors.primary}20` }}>
                                <FolderDot className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                             </div>
                             <span className="font-medium text-base whitespace-nowrap">{site.name}</span>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>
                           {site.createdAt.toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                              {hasPermission('obras', 'create') && (
                                <button 
                                  type="button"
                                  onClick={(e) => handleEdit(e, site)}
                                  className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                              )}
                              {hasPermission('obras', 'delete') && (
                                <button 
                                  type="button"
                                  onClick={(e) => handleDeleteClick(e, site.id!)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors z-20 relative"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
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
               {filteredSites.map((site) => (
                 <div 
                    key={site.id}
                    onClick={() => handleNavigate(site.id!)}
                    className="relative group p-6 rounded-xl border flex flex-col justify-between cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
                    style={{ 
                      backgroundColor: currentTheme.colors.card, 
                      borderColor: currentTheme.colors.border 
                    }}
                 >
                    {/* Actions (Absolute) */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {hasPermission('obras', 'create') && (
                          <button 
                            type="button"
                            onClick={(e) => handleEdit(e, site)}
                            className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {hasPermission('obras', 'delete') && (
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteClick(e, site.id!)}
                            className="p-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                       <div className="p-3 rounded-xl bg-opacity-10 shadow-inner" style={{ backgroundColor: `${currentTheme.colors.primary}15` }}>
                          <Building2 className="h-8 w-8" style={{ color: currentTheme.colors.primary }} />
                       </div>
                       <div>
                          <h3 className="font-bold text-lg leading-tight line-clamp-1" style={{ color: currentTheme.colors.text }}>{site.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-60" style={{ color: currentTheme.colors.textSecondary }}>
                             <Calendar size={12} />
                             <span>{site.createdAt.toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm" style={{ borderColor: currentTheme.colors.border }}>
                        <span className="opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Status</span>
                        <span className="font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-xs uppercase tracking-wide">Ativo</span>
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
            className="w-full max-w-lg rounded-2xl shadow-2xl border relative mx-4"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteConfirmationId(null)}
        >
          <div 
            className="w-full max-w-sm rounded-xl shadow-2xl border p-6 text-center animate-in zoom-in-95 duration-200"
            style={{ 
              backgroundColor: currentTheme.colors.card, 
              borderColor: currentTheme.colors.border 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h3 className="text-lg font-bold mb-2" style={{ color: currentTheme.colors.text }}>Excluir Obra?</h3>
            <p className="text-sm mb-6 opacity-80" style={{ color: currentTheme.colors.textSecondary }}>
              Tem certeza que deseja excluir esta obra? Todos os dados vinculados a ela (estoque, empréstimos) também serão perdidos.
            </p>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteConfirmationId(null)}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                isLoading={isDeleting}
                className="w-full"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ObrasPage;
