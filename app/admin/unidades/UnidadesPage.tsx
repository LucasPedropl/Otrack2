import React, { useEffect, useState, useRef } from 'react';
import { settingsService } from '../../../services/settingsService';
import { MeasurementUnit } from '../../../types';
import { Plus, Search, Ruler, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { BottomActionsBar } from '../../../components/layout/BottomActionsBar';

// Declare XLSX globally since it's loaded via CDN in index.html
declare global {
  interface Window {
    XLSX: any;
  }
}

const UnidadesPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
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
    // Restriction removed: allow editing any item
    setFormData({ name: unit.name, abbreviation: unit.abbreviation });
    setEditingId(unit.id!);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    // Restriction removed: allow deleting any item
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
        await settingsService.deleteUnit(deleteId);
        const newSelection = new Set(selectedIds);
        newSelection.delete(deleteId);
        setSelectedIds(newSelection);
        fetchUnits();
        setDeleteId(null);
    } catch (error) {
        console.error("Error deleting unit", error);
        alert("Erro ao excluir unidade.");
    } finally {
        setIsLoading(false);
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so allow re-selecting same file
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
      // Heuristic to find columns
      for (const row of data) {
         const name = row['Nome'] || row['NOME'] || row['nome'] || row['Unidade'];
         const abbr = row['Abreviação'] || row['Sigla'] || row['ABREVIACAO'] || row['Abreviação'] || row['Codigo'];

         if (name && abbr) {
           await settingsService.addUnit({
             name: String(name).trim(),
             abbreviation: String(abbr).trim()
           });
           count++;
         }
      }

      alert(`${count} unidades importadas com sucesso!`);
      fetchUnits();

    } catch (error) {
      console.error("Import error:", error);
      alert("Erro ao importar arquivo. Verifique se é um Excel/CSV válido com colunas 'Nome' e 'Abreviação'.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
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
      await Promise.all(Array.from(selectedIds).map((id: string) => settingsService.deleteUnit(id)));
      setSelectedIds(new Set());
      fetchUnits();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredUnits.slice(
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
                setCurrentPage(1);
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
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome</th>
                <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Abreviação</th>
                <th className="p-4 font-medium w-24 text-center" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="p-8 text-center opacity-50">
                      <Ruler className="h-8 w-8 mx-auto mb-2" />
                      Nenhuma unidade encontrada.
                   </td>
                 </tr>
              ) : (
                currentData.map((unit, index) => {
                  const isSelected = selectedIds.has(unit.id!);
                  const rowBackground = isSelected 
                      ? (currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff')
                      : index % 2 === 0 ? 'transparent' : (currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');

                  return (
                    <tr 
                        key={unit.id}
                        className="group hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: rowBackground }}
                    >
                        <td className="p-4 text-center">
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleSelectOne(unit.id!)}
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                        </td>
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
                            onClick={() => handleDeleteClick(unit.id!)}
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
        totalItems={filteredUnits.length}
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

      {/* Edit Modal */}
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
              Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita.
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

export default UnidadesPage;