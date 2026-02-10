import React, { useEffect, useState } from 'react';
import { accessProfileService } from '../../../services/accessProfileService';
import { AccessProfile } from '../../../types';
import { Plus, Search, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const PerfisPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Edit/Create State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<AccessProfile, 'id'>>({ 
    name: '', 
    description: '', 
    permissions: [],
    level: 'Médio'
  });

  const fetchProfiles = async () => {
    try {
      const data = await accessProfileService.getAll();
      setProfiles(data);
    } catch (error) {
      console.error("Failed to fetch profiles", error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleEdit = (profile: AccessProfile) => {
    if (profile.id?.startsWith('default-')) {
       alert("Este é um perfil padrão de demonstração. Crie um novo para testar a edição.");
       return;
    }
    setFormData({
       name: profile.name,
       description: profile.description,
       permissions: profile.permissions,
       level: profile.level
    });
    setEditingId(profile.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default-')) {
       alert("Não é possível excluir perfis padrão.");
       return;
    }
    if (window.confirm('Tem certeza que deseja excluir este perfil?')) {
      try {
        await accessProfileService.delete(id);
        fetchProfiles();
      } catch (error) {
        console.error("Error deleting profile", error);
        alert("Erro ao excluir perfil.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
         await accessProfileService.update(editingId, formData);
      } else {
         await accessProfileService.add(formData);
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
     setFormData({ name: '', description: '', permissions: [], level: 'Médio' });
     setEditingId(null);
  };

  const handleExport = () => {
    const headers = ["Nome", "Descrição", "Nível"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + profiles.map(p => `${p.name},${p.description},${p.level}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "perfis_acesso.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";

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
            setFormData({ name: '', description: '', permissions: [], level: 'Médio' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Descrição</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nível</th>
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
                currentData.map((item, index) => (
                  <tr 
                    key={item.id}
                    className="group hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                  >
                    <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>{item.name}</td>
                    <td className="p-4" style={{ color: currentTheme.colors.textSecondary }}>{item.description}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.level === 'Alto' ? 'bg-red-100 text-red-700' :
                            item.level === 'Médio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {item.level}
                        </span>
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

      <BottomActionsBar 
        totalItems={filteredData.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onImport={() => alert('Importação indisponível para perfis.')}
        onExport={handleExport}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <h2 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Perfil' : 'Novo Perfil'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Nome do Perfil</label>
                   <input 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className={baseInputClass}
                     required
                     placeholder="Ex: Supervisor"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Descrição</label>
                   <input 
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className={baseInputClass}
                     required
                     placeholder="Ex: Acesso apenas para leitura"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                    <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Nível de Acesso</label>
                    <select
                        value={formData.level}
                        onChange={e => setFormData({...formData, level: e.target.value as any})}
                        className={baseInputClass}
                        style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                    >
                        <option value="Baixo">Baixo (Operacional)</option>
                        <option value="Médio">Médio (Gerencial)</option>
                        <option value="Alto">Alto (Administrativo)</option>
                    </select>
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

export default PerfisPage;