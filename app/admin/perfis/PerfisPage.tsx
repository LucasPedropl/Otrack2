import React, { useEffect, useState } from 'react';
import { accessProfileService } from '../../../services/accessProfileService';
import { constructionService } from '../../../services/constructionService';
import { userService } from '../../../services/userService'; // Import userService
import { AccessProfile, ConstructionSite, User } from '../../../types';
import { Plus, Search, ShieldCheck, Trash2, Edit, ChevronDown, ChevronRight, Save, X, Building2, LayoutGrid, Settings as SettingsIcon, Archive, AlertTriangle, UserMinus, ArrowRightLeft } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

// --- CONFIGURAÇÃO DOS MÓDULOS ---

interface ModuleAction {
  id: string;
  label: string;
}

interface SystemModule {
  id: string;
  label: string;
  actions: ModuleAction[];
}

interface ModuleGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  modules: SystemModule[];
}

const COMMON_ACTIONS: ModuleAction[] = [
  { id: 'view', label: 'Pesquisar / Visualizar' },
  { id: 'create', label: 'Incluir / Editar' },
  { id: 'delete', label: 'Excluir' },
];

const VIEW_ONLY_ACTIONS: ModuleAction[] = [
  { id: 'view', label: 'Acesso ao Módulo' }
];

// Organized Groups
const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'navigation',
    title: 'Navegação Principal',
    icon: LayoutGrid,
    modules: [
      { id: 'obras', label: 'Gestão de Obras', actions: COMMON_ACTIONS },
    ]
  },
  {
    id: 'budget',
    title: 'Cadastros de Orçamento',
    icon: Archive,
    modules: [
      { id: 'orcamento_insumos', label: 'Insumos', actions: COMMON_ACTIONS },
      { id: 'orcamento_unidades', label: 'Unidades de Medida', actions: COMMON_ACTIONS },
      { id: 'orcamento_categorias', label: 'Categorias', actions: COMMON_ACTIONS },
    ]
  },
  {
    id: 'admin',
    title: 'Administração',
    icon: SettingsIcon,
    modules: [
      { id: 'acesso_usuarios', label: 'Usuários do Sistema', actions: COMMON_ACTIONS },
      { id: 'acesso_perfis', label: 'Perfis de Acesso', actions: COMMON_ACTIONS },
    ]
  }
];

const PerfisPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [availableSites, setAvailableSites] = useState<ConstructionSite[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  // Deletion State (Advanced)
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [affectedUsers, setAffectedUsers] = useState<User[]>([]);
  const [migrationProfileId, setMigrationProfileId] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Edit/Create State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [accessAllSites, setAccessAllSites] = useState(true);
  const [allowedSites, setAllowedSites] = useState<Set<string>>(new Set());

  // UI State for Accordions
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const fetchProfiles = async () => {
    try {
      const data = await accessProfileService.getAll();
      setProfiles(data);
    } catch (error) {
      console.error("Failed to fetch profiles", error);
    }
  };

  const fetchSites = async () => {
    try {
      const data = await constructionService.getAll();
      setAvailableSites(data);
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchSites();
  }, []);

  // --- Logic Helpers ---

  // NOTE: Previous "isAdmin" check removed to allow editing all profiles.

  const toggleModuleExpand = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
        newExpanded.delete(moduleId);
    } else {
        newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const hasModuleAccess = (module: string) => {
    const prefix = `${module}:`;
    return Array.from(permissions).some((p: string) => p.startsWith(prefix)) || permissions.has('admin:full');
  };

  const isFullAccess = (module: string, actions: ModuleAction[]) => {
    if (permissions.has('admin:full')) return true;
    return actions.every(action => permissions.has(`${module}:${action.id}`));
  };

  const hasPermission = (module: string, action: string) => {
    return permissions.has(`${module}:${action}`) || permissions.has('admin:full');
  };

  const togglePermission = (module: string, action: string, value: boolean) => {
    const permString = `${module}:${action}`;
    const newPerms = new Set(permissions);
    
    if (value) {
        newPerms.add(permString);
        if (action !== 'view') {
            newPerms.add(`${module}:view`);
        }
    } else {
        newPerms.delete(permString);
        if (action === 'view') {
            Array.from(newPerms).forEach((p: string) => {
                if (p.startsWith(`${module}:`)) newPerms.delete(p);
            });
        }
    }
    setPermissions(newPerms);
  };

  const toggleModuleFullAccess = (module: string, actions: ModuleAction[], value: boolean) => {
    const newPerms = new Set(permissions);
    actions.forEach(action => {
        const permString = `${module}:${action.id}`;
        if (value) {
            newPerms.add(permString);
        } else {
            newPerms.delete(permString);
        }
    });
    setPermissions(newPerms);
  };

  const handleSelectAllGlobal = () => {
    const allPerms = new Set<string>();
    MODULE_GROUPS.forEach(group => {
        group.modules.forEach(mod => {
            mod.actions.forEach(act => allPerms.add(`${mod.id}:${act.id}`));
        });
    });
    setPermissions(allPerms);
  };

  const handleDeselectAllGlobal = () => {
    setPermissions(new Set());
  };

  // --- Handlers ---

  const handleEdit = (profile: AccessProfile) => {
    setName(profile.name);
    setPermissions(new Set(profile.permissions));
    
    if (profile.allowedSites && profile.allowedSites.length > 0) {
        setAccessAllSites(false);
        setAllowedSites(new Set(profile.allowedSites));
    } else {
        setAccessAllSites(true);
        setAllowedSites(new Set());
    }

    setEditingId(profile.id!);
    setIsModalOpen(true);
    const allModuleIds = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.id));
    setExpandedModules(new Set(allModuleIds));
  };

  // --- DELETE LOGIC ---
  const handleClickDelete = async (id: string) => {
    setIsLoading(true);
    try {
        // Check for dependencies
        const users = await userService.getByProfileId(id);
        
        if (users.length > 0) {
            setAffectedUsers(users);
            setDeleteId(id);
        } else {
            setAffectedUsers([]);
            setDeleteId(id);
        }
    } catch (error) {
        console.error("Error checking profile dependencies", error);
    } finally {
        setIsLoading(false);
    }
  };

  // Option 1: Migrate users then delete profile
  const handleMigrateAndDelete = async () => {
     if (!deleteId || !migrationProfileId) return;
     
     setIsLoading(true);
     try {
        // 1. Update all users
        await Promise.all(affectedUsers.map(u => 
            userService.update(u.id!, { profileId: migrationProfileId })
        ));
        
        // 2. Delete profile
        await accessProfileService.delete(deleteId);
        
        handleCloseDelete();
        fetchProfiles();
     } catch (error) {
        console.error(error);
        alert("Erro ao migrar usuários.");
     } finally {
        setIsLoading(false);
     }
  };

  // Option 2: Delete everything (users + profile)
  const handleDeleteEverything = async () => {
    if (!deleteId) return;
    
    if (!window.confirm(`ATENÇÃO: Isso excluirá permanentemente ${affectedUsers.length} usuários e o perfil. Deseja continuar?`)) return;

    setIsLoading(true);
    try {
       // 1. Delete users
       await Promise.all(affectedUsers.map(u => userService.delete(u.id!)));
       
       // 2. Delete profile
       await accessProfileService.delete(deleteId);
       
       handleCloseDelete();
       fetchProfiles();
    } catch (error) {
       console.error(error);
       alert("Erro ao excluir dados.");
    } finally {
       setIsLoading(false);
    }
  };

  // Simple Delete (No users)
  const handleSimpleDelete = async () => {
     if (!deleteId) return;
     setIsLoading(true);
     try {
        await accessProfileService.delete(deleteId);
        handleCloseDelete();
        fetchProfiles();
     } catch (error) {
        console.error(error);
        alert("Erro ao excluir perfil.");
     } finally {
        setIsLoading(false);
     }
  };

  const handleCloseDelete = () => {
    setDeleteId(null);
    setAffectedUsers([]);
    setMigrationProfileId('');
    // Remove from selection if it was selected
    if (deleteId) {
        const newSelection = new Set(selectedIds);
        newSelection.delete(deleteId);
        setSelectedIds(newSelection);
    }
  };
  // -----------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Nome é obrigatório");

    setIsLoading(true);
    try {
      const payload: any = {
          name,
          permissions: Array.from(permissions),
      };

      if (!accessAllSites) {
          payload.allowedSites = Array.from(allowedSites);
      } else {
          payload.allowedSites = []; 
      }

      if (editingId) {
         await accessProfileService.update(editingId, payload);
      } else {
         await accessProfileService.add(payload);
      }
      handleCloseModal();
      fetchProfiles();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
     setIsModalOpen(false);
     setName('');
     setPermissions(new Set());
     setAccessAllSites(true);
     setAllowedSites(new Set());
     setEditingId(null);
  };

  const handleExport = () => {
    const headers = ["Nome", "Permissões (Qtd)"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + profiles.map(p => `${p.name},${p.permissions.length}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "perfis_acesso.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Bulk Handlers ---
  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = currentData.map(item => item.id!);
      const newSelection = new Set(selectedIds);
      allIds.forEach(id => newSelection.add(id));
      setSelectedIds(newSelection);
    } else {
      const newSelection = new Set(selectedIds);
      currentData.forEach(item => newSelection.delete(item.id!));
      setSelectedIds(newSelection);
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    // 1. Verify dependencies BEFORE showing confirm or proceeding
    setIsDeletingMultiple(true);
    try {
        const allUsers = await userService.getAll();
        const profilesWithUsers: string[] = [];

        // Check each selected profile for users
        idsToDelete.forEach((profileId: string) => {
            const hasUsers = allUsers.some(u => u.profileId === profileId);
            if (hasUsers) {
                const profileName = profiles.find(p => p.id === profileId)?.name || 'Desconhecido';
                profilesWithUsers.push(profileName);
            }
        });

        if (profilesWithUsers.length > 0) {
            alert(`Ação bloqueada!\n\nOs seguintes perfis possuem usuários vinculados e não podem ser excluídos em massa:\n\n- ${profilesWithUsers.join('\n- ')}\n\nPor favor, exclua-os individualmente para gerenciar a migração dos usuários.`);
            setIsDeletingMultiple(false);
            return;
        }

        // 2. Proceed if safe
        if (!window.confirm(`Tem certeza que deseja excluir ${idsToDelete.length} perfis sem usuários vinculados?`)) {
            setIsDeletingMultiple(false);
            return;
        }
        
        await Promise.all(idsToDelete.map((id: string) => accessProfileService.delete(id)));
        setSelectedIds(new Set());
        await fetchProfiles();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const filteredData = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = currentData.length > 0 && currentData.every(item => selectedIds.has(item.id!));

  // --- Styles ---
  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const labelStyle = { color: currentTheme.colors.text };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar perfil..."
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
            setName('');
            setPermissions(new Set());
            setEditingId(null);
            setAccessAllSites(true);
            setAllowedSites(new Set());
            setIsModalOpen(true);
            // Default expand groups
            setExpandedModules(new Set(MODULE_GROUPS.flatMap(g => g.modules.map(m => m.id))));
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse min-w-[500px]">
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
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Perfil</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Permissões</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="p-8 text-center opacity-50">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
                      Nenhum perfil encontrado.
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
                                className="rounded border-gray-300 focus:ring-brand-500 text-brand-600"
                            />
                        </td>
                        <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>
                            {item.name}
                        </td>
                        <td className="p-4">
                            <span className="text-xs px-2 py-1 rounded bg-opacity-10 border opacity-80" style={{ 
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                color: currentTheme.colors.text,
                                borderColor: currentTheme.colors.border
                            }}>
                                {item.permissions.length} regras
                            </span>
                        </td>
                        <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 rounded transition-colors hover:bg-blue-500/10 text-blue-500"
                                title="Editar"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={() => handleClickDelete(item.id!)}
                                className="p-1.5 rounded transition-colors hover:bg-red-500/10 text-red-500"
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
        onImport={() => alert('Importação indisponível para perfis.')}
        onExport={handleExport}
        selectedCount={selectedIds.size}
        onDeleteSelected={handleBulkDelete}
        onCancelSelection={() => setSelectedIds(new Set())}
        isDeleting={isDeletingMultiple}
      />

      {/* DETAILED EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" style={{ backgroundColor: currentTheme.colors.card }} onClick={(e) => e.stopPropagation()}>
             
             {/* Header */}
             <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
                        {editingId ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>Defina as permissões para este grupo de usuários.</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: currentTheme.colors.text }}>
                    <X size={20} />
                </button>
             </div>

             {/* Body (Scrollable) */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Basic Info */}
                <div>
                   <label className="block text-sm font-medium mb-1" style={labelStyle}>Nome do Perfil *</label>
                   <input 
                     value={name}
                     onChange={e => setName(e.target.value)}
                     className={baseInputClass}
                     required
                     placeholder="Ex: Engenheiro Residente"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>

                {/* Permissions Matrix */}
                <div>
                    <div className="flex justify-between items-center mb-6 border-b pb-2" style={{ borderColor: currentTheme.colors.border }}>
                        <h3 className="font-bold text-lg" style={{ color: currentTheme.colors.text }}>Permissões do Sistema</h3>
                        <div className="space-x-4 text-sm">
                            <button onClick={handleSelectAllGlobal} className="text-blue-500 hover:underline">Marcar todos</button>
                            <span style={{ color: currentTheme.colors.border }}>|</span>
                            <button onClick={handleDeselectAllGlobal} className="text-red-500 hover:underline">Desmarcar todos</button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {MODULE_GROUPS.map((group) => (
                            <div key={group.id}>
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider opacity-70" style={{ color: currentTheme.colors.primary }}>
                                    <group.icon size={16} />
                                    {group.title}
                                </div>
                                <div className="space-y-3">
                                    {group.modules.map((module) => {
                                        const isExpanded = expandedModules.has(module.id);
                                        const hasAccess = hasModuleAccess(module.id);
                                        const isFull = isFullAccess(module.id, module.actions);

                                        return (
                                            <div 
                                                key={module.id} 
                                                className="border rounded-lg overflow-hidden transition-all"
                                                style={{ 
                                                    borderColor: hasAccess ? currentTheme.colors.primary : currentTheme.colors.border,
                                                    backgroundColor: hasAccess ? `${currentTheme.colors.primary}05` : 'transparent' 
                                                }}
                                            >
                                                {/* Accordion Header */}
                                                <div className="flex items-center justify-between p-3 bg-opacity-50 hover:bg-opacity-100 transition-colors"
                                                    style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                                                >
                                                    <div 
                                                        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                                                        onClick={() => toggleModuleExpand(module.id)}
                                                    >
                                                        {isExpanded ? <ChevronDown size={18} style={{ color: currentTheme.colors.textSecondary }} /> : <ChevronRight size={18} style={{ color: currentTheme.colors.textSecondary }} />}
                                                        <span className="font-semibold" style={{ color: currentTheme.colors.text }}>{module.label}</span>
                                                    </div>

                                                    <div className="flex items-center gap-6 mr-2">
                                                        {/* Access Toggle */}
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <input 
                                                                type="checkbox"
                                                                checked={hasAccess}
                                                                onChange={(e) => togglePermission(module.id, 'view', e.target.checked)}
                                                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                                                            />
                                                            <span className="text-sm" style={{ color: currentTheme.colors.text }}>Acesso ao módulo</span>
                                                        </label>

                                                        {/* Full Access Toggle */}
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <input 
                                                                type="checkbox"
                                                                checked={isFull}
                                                                disabled={!hasAccess}
                                                                onChange={(e) => toggleModuleFullAccess(module.id, module.actions, e.target.checked)}
                                                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4 disabled:opacity-50"
                                                            />
                                                            <span className={`text-sm ${!hasAccess ? 'opacity-50' : ''}`} style={{ color: currentTheme.colors.text }}>Acesso completo</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Accordion Body (Specific Actions) */}
                                                {isExpanded && (
                                                    <div className="p-4 pl-10 border-t bg-opacity-30 bg-black/5" style={{ borderColor: currentTheme.colors.border }}>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {module.actions.map(action => (
                                                                <label key={action.id} className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80">
                                                                    <div className="relative flex items-center">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={hasPermission(module.id, action.id)}
                                                                            disabled={!hasAccess} // Must enable module first
                                                                            onChange={(e) => togglePermission(module.id, action.id, e.target.checked)}
                                                                            className="peer h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm ${!hasAccess ? 'opacity-50' : ''}`} style={{ color: currentTheme.colors.textSecondary }}>
                                                                        {action.label}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>

                                                        {/* Special Logic for "Obras" Module: Allowed Sites */}
                                                        {module.id === 'obras' && hasAccess && (
                                                            <div className="mt-6 pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
                                                                <h4 className="text-sm font-bold mb-3" style={{ color: currentTheme.colors.text }}>Restrição de Obras</h4>
                                                                <div className="space-y-4">
                                                                    {/* Access Type Radio */}
                                                                    <div className="flex gap-6">
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input 
                                                                                type="radio" 
                                                                                name="accessType" 
                                                                                checked={accessAllSites}
                                                                                onChange={() => setAccessAllSites(true)}
                                                                                className="text-brand-600 focus:ring-brand-500"
                                                                            />
                                                                            <span className="text-sm" style={{ color: currentTheme.colors.text }}>Ter acesso a todas as obras</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input 
                                                                                type="radio" 
                                                                                name="accessType" 
                                                                                checked={!accessAllSites}
                                                                                onChange={() => setAccessAllSites(false)}
                                                                                className="text-brand-600 focus:ring-brand-500"
                                                                            />
                                                                            <span className="text-sm" style={{ color: currentTheme.colors.text }}>Selecionar obras específicas</span>
                                                                        </label>
                                                                    </div>

                                                                    {/* Sites List Checklist */}
                                                                    {!accessAllSites && (
                                                                        <div 
                                                                            className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2 bg-white/5" 
                                                                            style={{ borderColor: currentTheme.colors.border }}
                                                                        >
                                                                            {availableSites.map(site => (
                                                                                <label key={site.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                                                                    <input 
                                                                                        type="checkbox"
                                                                                        checked={allowedSites.has(site.id!)}
                                                                                        onChange={(e) => {
                                                                                            const newSites = new Set(allowedSites);
                                                                                            if (e.target.checked) newSites.add(site.id!);
                                                                                            else newSites.delete(site.id!);
                                                                                            setAllowedSites(newSites);
                                                                                        }}
                                                                                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                                                    />
                                                                                    <Building2 size={14} className="opacity-50" />
                                                                                    <span className="text-sm" style={{ color: currentTheme.colors.text }}>{site.name}</span>
                                                                                </label>
                                                                            ))}
                                                                            {availableSites.length === 0 && (
                                                                                <p className="text-sm opacity-50 p-2">Nenhuma obra cadastrada.</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

             </div>

             {/* Footer */}
             <div className="p-4 border-t flex justify-end gap-3 bg-opacity-50 bg-gray-50/5" style={{ borderColor: currentTheme.colors.border }}>
                <Button variant="ghost" onClick={handleCloseModal} style={{ color: currentTheme.colors.text }}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    isLoading={isLoading} 
                    style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
                >
                    <Save size={18} className="mr-2" />
                    Salvar Perfil
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (Complex Logic) */}
      {deleteId && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleCloseDelete}
        >
          <div 
            className="w-full max-w-lg rounded-xl shadow-2xl border p-0 overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ 
              backgroundColor: currentTheme.colors.card, 
              borderColor: currentTheme.colors.border 
            }} 
            onClick={(e) => e.stopPropagation()}
          >
             {/* Header */}
             <div className="p-6 bg-red-500/10 border-b flex items-start gap-4" style={{ borderColor: currentTheme.colors.border }}>
                <div className="p-3 rounded-full bg-red-100 flex-shrink-0">
                   <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-red-600">
                        {affectedUsers.length > 0 ? 'Exclusão Bloqueada: Usuários Vinculados' : 'Confirmar Exclusão'}
                    </h3>
                    <p className="text-sm mt-1 opacity-80" style={{ color: currentTheme.colors.text }}>
                        {affectedUsers.length > 0 
                            ? `Este perfil está sendo utilizado por ${affectedUsers.length} usuários. Você precisa decidir o que fazer com eles.`
                            : 'Tem certeza que deseja excluir este perfil? Esta ação é irreversível.'
                        }
                    </p>
                </div>
             </div>

             {/* Body */}
             <div className="p-6">
                 {affectedUsers.length > 0 ? (
                    <div className="space-y-6">
                        {/* List of Users */}
                        <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-black/5 space-y-1">
                            {affectedUsers.map(user => (
                                <div key={user.id} className="text-xs flex justify-between items-center p-1">
                                    <span style={{ color: currentTheme.colors.text }}>{user.name || user.email}</span>
                                    <span className="opacity-50">{user.email}</span>
                                </div>
                            ))}
                        </div>

                        {/* Option A: Migrate */}
                        <div className="p-4 rounded-lg border bg-blue-500/5" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                            <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: currentTheme.colors.text }}>
                                <ArrowRightLeft size={16} className="text-blue-500" />
                                Opção 1: Migrar Usuários
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select 
                                    className="flex-1 p-2 rounded border text-sm"
                                    style={{ 
                                        backgroundColor: currentTheme.colors.background, 
                                        color: currentTheme.colors.text,
                                        borderColor: currentTheme.colors.border
                                    }}
                                    value={migrationProfileId}
                                    onChange={(e) => setMigrationProfileId(e.target.value)}
                                >
                                    <option value="">Selecione novo perfil...</option>
                                    {profiles
                                        .filter(p => p.id !== deleteId)
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                                <Button 
                                    onClick={handleMigrateAndDelete}
                                    disabled={!migrationProfileId}
                                    isLoading={isLoading}
                                    className="whitespace-nowrap"
                                >
                                    Migrar e Excluir
                                </Button>
                            </div>
                        </div>

                        {/* Option B: Delete All */}
                        <div className="p-4 rounded-lg border bg-red-500/5" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <h4 className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: currentTheme.colors.text }}>
                                <UserMinus size={16} className="text-red-500" />
                                Opção 2: Zona de Perigo
                            </h4>
                            <div className="flex justify-between items-center">
                                <p className="text-xs opacity-70" style={{ color: currentTheme.colors.text }}>
                                    Apaga o perfil E as contas dos usuários.
                                </p>
                                <Button 
                                    variant="danger" 
                                    onClick={handleDeleteEverything}
                                    isLoading={isLoading}
                                    className="text-xs h-8"
                                >
                                    Excluir Tudo
                                </Button>
                            </div>
                        </div>
                    </div>
                 ) : (
                    // Simple Confirmation
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={handleCloseDelete}>Cancelar</Button>
                        <Button variant="danger" onClick={handleSimpleDelete} isLoading={isLoading}>Confirmar Exclusão</Button>
                    </div>
                 )}
             </div>
             
             {affectedUsers.length > 0 && (
                 <div className="p-4 border-t bg-gray-50/5 flex justify-end" style={{ borderColor: currentTheme.colors.border }}>
                    <Button variant="ghost" onClick={handleCloseDelete}>Cancelar Operação</Button>
                 </div>
             )}
          </div>
        </div>
      )}
    </>
  );
};

export default PerfisPage;