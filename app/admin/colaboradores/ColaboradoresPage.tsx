import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { collaboratorService, Collaborator } from '../../../services/collaboratorService';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';
import CollaboratorForm from './CollaboratorForm';

const ColaboradoresPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const { hasPermission } = usePermissions();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | undefined>(undefined);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const data = await collaboratorService.getAll();
      setCollaborators(data);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredData = collaborators.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = currentData.length > 0 && currentData.every(item => selectedIds.has(item.id!));

  const handleAdd = () => {
    setSelectedCollaborator(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await collaboratorService.delete(deleteId);
      const newSelection = new Set(selectedIds);
      newSelection.delete(deleteId);
      setSelectedIds(newSelection);
      await fetchCollaborators();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      alert('Erro ao excluir colaborador.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsModalOpen(false);
    fetchCollaborators();
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

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
        setIsBulkDeleteModalOpen(true);
    }
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds) as string[];
    
    setIsDeletingMultiple(true);
    try {
      await Promise.all(idsToDelete.map(id => collaboratorService.delete(id)));
      setSelectedIds(new Set());
      await fetchCollaborators();
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou empresa..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: currentTheme.colors.card,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
                '--tw-ring-color': currentTheme.colors.primary 
              } as any}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {hasPermission('mao_obra_colaboradores', 'create') && (
          <Button 
            onClick={handleAdd}
            style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Colaborador
          </Button>
        )}
      </div>

      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
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
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Empresa</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Telefone</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Email</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="p-8 text-center opacity-50">
                      <User className="h-8 w-8 mx-auto mb-2" />
                      Nenhum colaborador encontrado.
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
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                              {item.fotoUrl ? (
                                <img src={item.fotoUrl} alt={item.nome} className="h-full w-full object-cover" />
                              ) : (
                                <User className="text-slate-400" size={16} />
                              )}
                            </div>
                            <span className="font-medium" style={{ color: currentTheme.colors.text }}>{item.nome}</span>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>{item.empresa}</td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>{item.telefone}</td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>{item.email || '-'}</td>
                        <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {hasPermission('mao_obra_colaboradores', 'create') && (
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {hasPermission('mao_obra_colaboradores', 'delete') && (
                              <button 
                                onClick={() => handleDeleteClick(item.id!)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
        onExport={() => {}}
        selectedCount={selectedIds.size}
        onDeleteSelected={hasPermission('mao_obra_colaboradores', 'delete') ? handleBulkDeleteClick : undefined}
        onCancelSelection={() => setSelectedIds(new Set())}
        isDeleting={isDeletingMultiple}
      />

      {isModalOpen && (
        <CollaboratorForm 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedCollaborator}
        />
      )}

      {/* Delete Confirmation Modal (Single) */}
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
              Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
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
                isLoading={loading}
                className="w-full"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsBulkDeleteModalOpen(false)}
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
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            
            <h3 className="text-lg font-bold mb-2" style={{ color: currentTheme.colors.text }}>Exclusão em Massa</h3>
            <p className="text-sm mb-6 opacity-80" style={{ color: currentTheme.colors.textSecondary }}>
              Tem certeza que deseja excluir <b>{selectedIds.size}</b> itens selecionados? 
              <br/>
              <span className="text-xs text-red-500 mt-1 block">Esta ação é irreversível.</span>
            </p>

            <div className="flex gap-3 justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmBulkDelete}
                isLoading={isDeletingMultiple}
                className="w-full"
              >
                Sim, Excluir Tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ColaboradoresPage;
