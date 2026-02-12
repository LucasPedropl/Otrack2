import React, { useEffect, useState, useRef } from 'react';
import { userService } from '../../../services/userService';
import { accessProfileService } from '../../../services/accessProfileService';
import { authService } from '../../../services/authService';
import { User, AccessProfile } from '../../../types';
import { Plus, Search, Users, Trash2, Edit, Mail, AlertTriangle, ChevronDown, Shield } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const UsuariosPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '',
    email: '', 
    role: 'operario',
    profileId: ''
  });

  // Profile Search State (Combobox)
  const [profileSearch, setProfileSearch] = useState('');
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [usersData, profilesData] = await Promise.all([
        userService.getAll(),
        accessProfileService.getAll()
      ]);
      setUsers(usersData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = (user: User) => {
    // Find profile name for the search input
    const userProfile = profiles.find(p => p.id === user.profileId);
    setProfileSearch(userProfile ? userProfile.name : '');

    setFormData({
       name: user.name,
       email: user.email,
       role: user.role,
       profileId: user.profileId
    });
    setEditingId(user.id!);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const currentUser = authService.getCurrentUser();
    const targetUser = users.find(u => u.id === id);

    // 1. Prevent self-deletion
    if (currentUser && currentUser.email === targetUser?.email) {
        alert("Segurança: Você não pode excluir sua própria conta enquanto está logado.");
        return;
    }

    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
      await userService.delete(deleteId);
      const newSelection = new Set(selectedIds);
      newSelection.delete(deleteId);
      setSelectedIds(newSelection);
      await fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting user", error);
      alert("Erro ao excluir usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.profileId) {
        alert("Por favor, selecione um Perfil de Acesso para o usuário.");
        return;
    }

    setIsLoading(true);
    try {
      // Logic to sync legacy role with selected profile if needed
      // For now we keep 'operario' as default legacy role but rely on profileId
      const payload = { ...formData };

      if (editingId) {
         await userService.update(editingId, payload);
      } else {
         await userService.add(payload as User);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
     setIsModalOpen(false);
     setFormData({ name: '', email: '', role: 'operario', profileId: '' });
     setProfileSearch('');
     setEditingId(null);
     setShowProfileOptions(false);
  };

  const handleExport = () => {
    const headers = ["Nome", "Email", "Perfil", "Data Cadastro"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + users.map(u => {
           const profileName = profiles.find(p => p.id === u.profileId)?.name || u.role;
           return `${u.name},${u.email},${profileName},${u.createdAt}`;
       }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "usuarios_sistema.csv");
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
    const currentUser = authService.getCurrentUser();
    const idsToDelete = Array.from(selectedIds) as string[];
    
    // Filter out unsafe deletions (only self)
    const safeToDeleteIds = idsToDelete.filter((id) => {
        const u = users.find(user => user.id === id);
        if (!u) return false;
        if (u.email === currentUser?.email) return false;
        return true;
    });

    if (safeToDeleteIds.length < idsToDelete.length) {
        alert("Você selecionou sua própria conta. Ela não será excluída para manter seu acesso.");
    }

    if (safeToDeleteIds.length === 0) return;

    if (!window.confirm(`Tem certeza que deseja excluir ${safeToDeleteIds.length} usuários?`)) return;
    
    setIsDeletingMultiple(true);
    try {
      await Promise.all(safeToDeleteIds.map(id => userService.delete(id)));
      setSelectedIds(new Set());
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const filteredData = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = currentData.length > 0 && currentData.every(item => selectedIds.has(item.id!));

  // --- Styles ---
  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  // Filter profiles for Combobox
  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
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
            setFormData({ name: '', email: '', role: 'operario', profileId: '' });
            setProfileSearch('');
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
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
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Usuário</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Email</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Perfil de Acesso</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Cadastro</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="p-8 text-center opacity-50">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      Nenhum usuário encontrado.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => {
                  const isSelected = selectedIds.has(item.id!);
                  const rowBackground = isSelected 
                      ? (currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff')
                      : index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
                  
                  // Resolve profile name
                  const profileName = profiles.find(p => p.id === item.profileId)?.name || item.role;

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
                                className="rounded border-gray-300 focus:ring-brand-500"
                            />
                        </td>
                        <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>
                            {item.name || 'Usuário Sem Nome'}
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.text }}>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="opacity-50" />
                                {item.email}
                            </div>
                        </td>
                        <td className="p-4">
                            <span className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold w-fit bg-opacity-10 border opacity-80" style={{ 
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: currentTheme.colors.text,
                                borderColor: currentTheme.colors.border
                            }}>
                                <Shield size={12} />
                                {profileName}
                            </span>
                        </td>
                        <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </td>
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
        onImport={() => alert('Importação indisponível.')}
        onExport={handleExport}

        // Bulk props
        selectedCount={selectedIds.size}
        onDeleteSelected={handleBulkDelete}
        onCancelSelection={() => setSelectedIds(new Set())}
        isDeleting={isDeletingMultiple}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6 mx-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <h2 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Nome Completo *</label>
                   <input 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className={baseInputClass}
                     style={dynamicInputStyle}
                     required
                     placeholder="Ex: João Silva"
                   />
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Email Corporativo *</label>
                   <input 
                     type="email"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className={baseInputClass}
                     style={dynamicInputStyle}
                     required
                     placeholder="Ex: joao@empresa.com"
                   />
                </div>
                
                {/* Profile Search Combobox */}
                <div className="relative" ref={profileRef}>
                    <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Perfil de Acesso / Função *</label>
                    <div className="relative">
                        <input
                            value={profileSearch}
                            onChange={(e) => {
                                setProfileSearch(e.target.value);
                                setShowProfileOptions(true);
                                // Clear ID if user types something new until they select
                                if (formData.profileId) {
                                    setFormData(prev => ({ ...prev, profileId: '' }));
                                }
                            }}
                            onFocus={() => setShowProfileOptions(true)}
                            placeholder="Selecione o perfil..."
                            className={baseInputClass}
                            style={dynamicInputStyle}
                            autoComplete="off"
                            required
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                    </div>

                    {showProfileOptions && (
                        <ul 
                            className="absolute z-[100] w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg"
                            style={{ 
                                backgroundColor: currentTheme.colors.card, 
                                borderColor: currentTheme.colors.border 
                            }}
                        >
                            {filteredProfiles.map(profile => (
                                <li 
                                    key={profile.id} 
                                    onMouseDown={() => {
                                        setFormData(prev => ({ ...prev, profileId: profile.id }));
                                        setProfileSearch(profile.name);
                                        setShowProfileOptions(false);
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
                                    {profile.name}
                                </li>
                            ))}
                            {filteredProfiles.length === 0 && (
                                <li className="px-3 py-2 text-sm opacity-50" style={{ color: currentTheme.colors.text }}>Nenhum perfil encontrado...</li>
                            )}
                        </ul>
                    )}
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
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
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

export default UsuariosPage;