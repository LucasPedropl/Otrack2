import React, { useEffect, useState } from 'react';
import { userService } from '../../../services/userService';
import { User } from '../../../types';
import { Plus, Search, Users, Trash2, Edit, Mail } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const UsuariosPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '',
    email: '', 
    role: 'operario'
  });

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setFormData({
       name: user.name,
       email: user.email,
       role: user.role
    });
    setEditingId(user.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await userService.delete(id);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user", error);
        alert("Erro ao excluir usuário.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
         await userService.update(editingId, formData);
      } else {
         await userService.add(formData as User);
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
     setIsModalOpen(false);
     setFormData({ name: '', email: '', role: 'operario' });
     setEditingId(null);
  };

  const handleExport = () => {
    const headers = ["Nome", "Email", "Função", "Data Cadastro"];
    const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n" 
       + users.map(u => `${u.name},${u.email},${u.role},${u.createdAt}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "usuarios_sistema.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            setFormData({ name: '', email: '', role: 'operario' });
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
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Usuário</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Email</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Função</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Cadastro</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-8 text-center opacity-50">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      Nenhum usuário encontrado.
                   </td>
                 </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr 
                    key={item.id}
                    className="group hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                  >
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
                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                            item.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            item.role === 'almoxarife' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {item.role}
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
        onImport={() => alert('Importação indisponível.')}
        onExport={handleExport}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <h2 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Nome Completo</label>
                   <input 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className={baseInputClass}
                     required
                     placeholder="Ex: João Silva"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Email Corporativo</label>
                   <input 
                     type="email"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className={baseInputClass}
                     required
                     placeholder="Ex: joao@empresa.com"
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                    <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Função / Perfil</label>
                    <select
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                        className={baseInputClass}
                        style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                    >
                        <option value="operario">Operário</option>
                        <option value="almoxarife">Almoxarife</option>
                        <option value="admin">Administrador</option>
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

export default UsuariosPage;