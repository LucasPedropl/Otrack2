import React, { useEffect, useState } from 'react';
import { settingsService } from '../../../services/settingsService';
import { MeasurementUnit } from '../../../types';
import { Plus, Search, Ruler, Trash2, Edit } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

const UnidadesPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Edit/Create State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '' });

  const fetchUnits = async () => {
    try {
      const data = await settingsService.getUnits();
      setUnits(data);
    } catch (error) {
      console.error("Failed to fetch units", error);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleEdit = (unit: MeasurementUnit) => {
    if (unit.id?.startsWith('default-')) {
       alert("Este é um item padrão de demonstração. Importe a lista para poder editar.");
       return;
    }
    setFormData({ name: unit.name, abbreviation: unit.abbreviation });
    setEditingId(unit.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default-')) {
       alert("Não é possível excluir itens padrão do sistema (mock). Importe os dados para editar.");
       return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
      try {
        await settingsService.deleteUnit(id);
        fetchUnits();
      } catch (error) {
        console.error("Error deleting unit", error);
        alert("Erro ao excluir unidade.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
         await settingsService.updateUnit(editingId, formData);
      } else {
         await settingsService.addUnit(formData);
      }
      setIsModalOpen(false);
      setFormData({ name: '', abbreviation: '' });
      setEditingId(null);
      fetchUnits();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', abbreviation: '' });
    setEditingId(null);
  };

  const handleImport = async () => {
    if(window.confirm("Isso importará a lista padrão completa para o banco de dados. Deseja continuar?")) {
      setIsLoading(true);
      try {
        await settingsService.importDefaultUnits();
        alert("Importação concluída com sucesso!");
        fetchUnits();
      } catch (error) {
        console.error(error);
        alert("Erro na importação.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExport = () => {
     // Simple CSV Export
     const headers = ["Nome", "Abreviação"];
     const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + units.map(u => `${u.name},${u.abbreviation}`).join("\n");
     
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "unidades_medida.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const currentData = filteredUnits.slice(
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
              placeholder="Buscar unidade..."
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
                setCurrentPage(1); // Reset page on search
              }}
            />
          </div>
        </div>

        <Button 
          onClick={() => {
            setFormData({ name: '', abbreviation: '' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Table Container with padding-bottom for fixed footer */}
      <div className="pb-20">
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }}>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Abreviação</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={3} className="p-8 text-center opacity-50">
                      <Ruler className="h-8 w-8 mx-auto mb-2" />
                      Nenhuma unidade encontrada.
                   </td>
                 </tr>
              ) : (
                currentData.map((unit, index) => (
                  <tr 
                    key={unit.id}
                    className="group hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}
                  >
                    <td className="p-4" style={{ color: currentTheme.colors.text }}>{unit.name}</td>
                    <td className="p-4 font-mono font-bold" style={{ color: currentTheme.colors.primary }}>{unit.abbreviation}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleEdit(unit)}
                          className="p-1.5 rounded hover:bg-blue-500/10 text-blue-500 transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(unit.id!)}
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
        totalItems={filteredUnits.length}
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
          <div className="w-full max-w-md rounded-2xl shadow-xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
             <h2 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                {editingId ? 'Editar Unidade' : 'Nova Unidade'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Nome</label>
                   <input 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full p-2 rounded border"
                     required
                     style={{ backgroundColor: 'transparent', borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}
                   />
                </div>
                <div>
                   <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Abreviação</label>
                   <input 
                     value={formData.abbreviation}
                     onChange={e => setFormData({...formData, abbreviation: e.target.value})}
                     className="w-full p-2 rounded border"
                     required
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

export default UnidadesPage;