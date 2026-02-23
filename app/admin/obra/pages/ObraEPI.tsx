import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { collaboratorService, Collaborator } from '../../../../services/collaboratorService';
import { siteCollaboratorService, SiteCollaborator } from '../../../../services/siteCollaboratorService';
import { siteInventoryService } from '../../../../services/siteInventoryService';
import { epiService } from '../../../../services/epiService';
import { SiteInventoryItem, EPIWithdrawal } from '../../../../types';
import { Plus, Search, HardHat, Calendar, User, Package, AlertCircle, LayoutList, LayoutGrid, X, History, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../../../components/ui/Button';

const ObraEPI: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<EPIWithdrawal[]>([]);
  const [siteCollaborators, setSiteCollaborators] = useState<SiteCollaborator[]>([]);
  const [globalCollaborators, setGlobalCollaborators] = useState<Collaborator[]>([]);
  const [epiItems, setEpiItems] = useState<SiteInventoryItem[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'epis' | 'collaborators' | 'history'>('epis');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCollaboratorHistory, setSelectedCollaboratorHistory] = useState<EPIWithdrawal[]>([]);
  const [selectedCollaboratorName, setSelectedCollaboratorName] = useState('');

  // Form State
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search States for Modals
  const [withdrawalCollaboratorSearch, setWithdrawalCollaboratorSearch] = useState('');
  const [addCollaboratorSearch, setAddCollaboratorSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [siteId]);

  const fetchData = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      // Fetch global collaborators first
      const globalCollabs = await collaboratorService.getAll();
      setGlobalCollaborators(globalCollabs);

      // Try to fetch site collaborators, handle permission error gracefully
      let siteCollabs: SiteCollaborator[] = [];
      try {
        siteCollabs = await siteCollaboratorService.getSiteCollaborators(siteId);
      } catch (e) {
        console.warn("Could not fetch site collaborators:", e);
      }
      setSiteCollaborators(siteCollabs);

      const [inventory, history] = await Promise.all([
        siteInventoryService.getSiteInventory(siteId),
        epiService.getWithdrawals(siteId)
      ]);
      
      // Filter inventory for EPI items (broader filter)
      const epis = inventory.filter(item => {
        const cat = item.category.toLowerCase();
        return cat === 'epi' || 
               cat.includes('epi') || 
               cat.includes('proteção') || 
               cat.includes('segurança');
      });
      setEpiItems(epis);
      setWithdrawals(history);
    } catch (error) {
      console.error("Erro ao carregar dados de EPI:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWithdrawal = (item?: SiteInventoryItem) => {
    if (item) {
      setSelectedItemId(item.id!);
    } else {
      setSelectedItemId('');
    }
    setSelectedCollaboratorId('');
    setWithdrawalCollaboratorSearch('');
    setQuantity(1);
    setNotes('');
    setShowWithdrawalModal(true);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !selectedCollaboratorId || !selectedItemId || quantity <= 0) return;

    setSubmitting(true);
    try {
      // Find collaborator info
      let collaboratorName = '';
      const siteCollab = siteCollaborators.find(c => c.id === selectedCollaboratorId);
      
      if (siteCollab) {
        collaboratorName = siteCollab.name;
      } else {
         // Fallback: check if it's a global ID directly
         const globalCollab = globalCollaborators.find(c => c.id === selectedCollaboratorId);
         if (globalCollab) {
             collaboratorName = globalCollab.nome;
         } else {
             // If we can't find it, maybe it's just an ID we don't have details for?
             // But we should have it in one of the lists.
             console.warn("Collaborator details not found for ID:", selectedCollaboratorId);
             collaboratorName = "Desconhecido";
         }
      }

      const item = epiItems.find(i => i.id === selectedItemId);

      if (!item) {
        throw new Error("Item inválido");
      }

      if (item.quantity < quantity) {
        alert(`Estoque insuficiente! Disponível: ${item.quantity}`);
        setSubmitting(false);
        return;
      }

      await epiService.registerWithdrawal(siteId, {
        siteId,
        collaboratorId: selectedCollaboratorId,
        collaboratorName: collaboratorName,
        itemId: item.id!,
        itemName: item.name,
        quantity,
        date: new Date(),
        notes
      });

      setShowWithdrawalModal(false);
      fetchData(); 
    } catch (error) {
      console.error("Erro ao registrar retirada:", error);
      alert("Erro ao registrar retirada.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCollaborator = async (globalCollabId: string) => {
    if (!siteId || !globalCollabId) return;

    setSubmitting(true);
    try {
      const globalCollab = globalCollaborators.find(c => c.id === globalCollabId);
      if (!globalCollab) throw new Error("Colaborador global não encontrado");

      await siteCollaboratorService.addCollaboratorToSite(siteId, globalCollab);
      
      setShowAddCollaboratorModal(false);
      setAddCollaboratorSearch('');
      fetchData();
    } catch (error) {
      console.error("Erro ao adicionar colaborador:", error);
      alert("Erro ao adicionar colaborador. Verifique se já não está cadastrado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    if (!siteId || !window.confirm("Tem certeza que deseja remover este colaborador da obra?")) return;
    try {
      await siteCollaboratorService.removeCollaboratorFromSite(siteId, collabId);
      fetchData();
    } catch (error) {
      console.error("Erro ao remover colaborador:", error);
      alert("Erro ao remover colaborador.");
    }
  };

  const handleViewHistory = (collabName: string) => {
    const history = withdrawals.filter(w => w.collaboratorName === collabName);
    setSelectedCollaboratorHistory(history);
    setSelectedCollaboratorName(collabName);
    setShowHistoryModal(true);
  };

  // Filter Logic
  const filteredEPIs = epiItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCollaborators = siteCollaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = withdrawals.filter(w => 
    w.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter for Modals
  const filteredGlobalCollaborators = globalCollaborators
    .filter(gc => !siteCollaborators.some(sc => sc.originalCollaboratorId === gc.id))
    .filter(gc => gc.nome.toLowerCase().includes(addCollaboratorSearch.toLowerCase()));

  const filteredWithdrawalCollaborators = siteCollaborators
    .filter(c => c.name.toLowerCase().includes(withdrawalCollaboratorSearch.toLowerCase()));

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><HardHat size={24} /></div>
            <div>
               <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>EPIs Cadastrados</p>
               <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{epiItems.length}</p>
            </div>
         </div>
         <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600"><User size={24} /></div>
            <div>
               <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Colaboradores</p>
               <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{siteCollaborators.length}</p>
            </div>
         </div>
         <div className="p-4 rounded-xl border flex items-center gap-4" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600"><History size={24} /></div>
            <div>
               <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Retiradas Totais</p>
               <p className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>{withdrawals.length}</p>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: currentTheme.colors.border }}>
         <button 
           onClick={() => setActiveTab('epis')}
           className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'epis' ? 'border-blue-500 text-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
           style={{ color: activeTab === 'epis' ? undefined : currentTheme.colors.text }}
         >
            EPIs Disponíveis
         </button>
         <button 
           onClick={() => setActiveTab('collaborators')}
           className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'collaborators' ? 'border-purple-500 text-purple-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
           style={{ color: activeTab === 'collaborators' ? undefined : currentTheme.colors.text }}
         >
            Colaboradores ({siteCollaborators.length})
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-gray-500 text-gray-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
           style={{ color: activeTab === 'history' ? undefined : currentTheme.colors.text }}
         >
            Histórico
         </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'epis' ? "Buscar EPI..." : activeTab === 'collaborators' ? "Buscar Colaborador..." : "Buscar no histórico..."}
              className={baseInputClass}
              style={{ ...dynamicInputStyle, paddingLeft: '2.5rem' }}
            />
         </div>
         
         {activeTab === 'epis' && (
             <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: currentTheme.colors.border }}>
                 <button 
                     onClick={() => setViewMode('list')}
                     className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-opacity-100' : 'bg-opacity-0 hover:bg-opacity-10'}`}
                     style={{ 
                     backgroundColor: viewMode === 'list' ? currentTheme.colors.primary : 'transparent',
                     color: viewMode === 'list' ? '#fff' : currentTheme.colors.text
                     }}
                     title="Lista"
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
                     title="Cards"
                 >
                     <LayoutGrid size={20} />
                 </button>
             </div>
         )}

         {activeTab === 'collaborators' && (
             <Button onClick={() => setShowAddCollaboratorModal(true)}>
                 <Plus size={16} className="mr-2" /> Adicionar Colaborador
             </Button>
         )}
      </div>

      {/* EPIs Tab Content */}
      {activeTab === 'epis' && (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEPIs.map(item => (
              <div key={item.id} className="p-4 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                <div>
                  <h4 className="font-bold mb-2" style={{ color: currentTheme.colors.text }}>{item.name}</h4>
                  <p className={`font-bold text-sm mb-4 ${item.quantity === 0 ? 'text-red-500' : 'text-green-500'}`}>
                    Disponível: {item.quantity} {item.unit}
                  </p>
                </div>
                <Button 
                  onClick={() => handleOpenWithdrawal(item)}
                  disabled={item.quantity <= 0}
                  variant={item.quantity <= 0 ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {item.quantity <= 0 ? 'Indisponível' : 'Entregar'}
                </Button>
              </div>
            ))}
            {filteredEPIs.length === 0 && <p className="col-span-full text-center py-8 opacity-50">Nenhum EPI encontrado.</p>}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
            <table className="w-full text-left text-sm">
              <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
                <tr>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Item</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Unidade</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Disponibilidade</th>
                  <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
                {filteredEPIs.map(item => (
                  <tr key={item.id} className="hover:bg-opacity-50" style={{ backgroundColor: currentTheme.colors.card }}>
                    <td className="p-4 font-bold" style={{ color: currentTheme.colors.text }}>{item.name}</td>
                    <td className="p-4" style={{ color: currentTheme.colors.text }}>{item.unit}</td>
                    <td className="p-4">
                      <span className={`font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        onClick={() => handleOpenWithdrawal(item)}
                        disabled={item.quantity <= 0}
                        variant="secondary"
                        className="h-8 text-xs"
                      >
                        Entregar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredEPIs.length === 0 && <tr><td colSpan={4} className="p-8 text-center opacity-50">Nenhum EPI encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Collaborators Tab Content */}
      {activeTab === 'collaborators' && (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
           <table className="w-full text-left text-sm">
             <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
               <tr>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Nome</th>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data Admissão (Obra)</th>
                 <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
               {filteredCollaborators.map(collab => (
                 <tr key={collab.id} className="hover:bg-opacity-50" style={{ backgroundColor: currentTheme.colors.card }}>
                   <td className="p-4 font-bold" style={{ color: currentTheme.colors.text }}>
                     <button onClick={() => handleViewHistory(collab.name)} className="hover:underline flex items-center gap-2">
                       <User size={16} />
                       {collab.name}
                     </button>
                   </td>
                   <td className="p-4" style={{ color: currentTheme.colors.text }}>
                     {collab.admissionDate ? format(collab.admissionDate, "dd/MM/yyyy", { locale: ptBR }) : '-'}
                   </td>
                   <td className="p-4 text-right flex justify-end gap-2">
                     <Button variant="secondary" className="h-8 text-xs" onClick={() => handleViewHistory(collab.name)}>
                       <History size={14} className="mr-1" /> Histórico
                     </Button>
                     <Button variant="destructive" className="h-8 text-xs" onClick={() => handleRemoveCollaborator(collab.id!)}>
                       <Trash2 size={14} />
                     </Button>
                   </td>
                 </tr>
               ))}
               {filteredCollaborators.length === 0 && <tr><td colSpan={3} className="p-8 text-center opacity-50">Nenhum colaborador cadastrado nesta obra.</td></tr>}
             </tbody>
           </table>
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
           <table className="w-full text-left text-sm">
             <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
               <tr>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data</th>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Colaborador</th>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Item</th>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Qtd</th>
                 <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Obs</th>
               </tr>
             </thead>
             <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
               {filteredHistory.map(h => (
                 <tr key={h.id} className="hover:bg-opacity-50 cursor-pointer" onClick={() => handleViewHistory(h.collaboratorName)} style={{ backgroundColor: currentTheme.colors.card }}>
                   <td className="p-4" style={{ color: currentTheme.colors.text }}>
                     {format(h.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                   </td>
                   <td className="p-4 font-bold" style={{ color: currentTheme.colors.text }}>{h.collaboratorName}</td>
                   <td className="p-4" style={{ color: currentTheme.colors.text }}>{h.itemName}</td>
                   <td className="p-4" style={{ color: currentTheme.colors.text }}>{h.quantity}</td>
                   <td className="p-4 opacity-70" style={{ color: currentTheme.colors.text }}>{h.notes || '-'}</td>
                 </tr>
               ))}
               {filteredHistory.length === 0 && <tr><td colSpan={5} className="p-8 text-center opacity-50">Nenhum registro encontrado.</td></tr>}
             </tbody>
           </table>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdrawalModal(false)}>
          <div className="w-full max-w-md rounded-xl shadow-2xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>Registrar Entrega de EPI</h3>
            
            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>Colaborador (Obra)</label>
                
                {/* Searchable Dropdown for Withdrawal */}
                <div className="relative">
                    <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500" style={{ borderColor: currentTheme.colors.border }}>
                        <Search size={18} className="ml-2 opacity-50" style={{ color: currentTheme.colors.text }} />
                        <input 
                            type="text"
                            placeholder="Buscar colaborador..."
                            value={withdrawalCollaboratorSearch}
                            onChange={(e) => {
                                setWithdrawalCollaboratorSearch(e.target.value);
                                setSelectedCollaboratorId(''); // Clear selection on search change
                            }}
                            className="w-full p-2 bg-transparent outline-none"
                            style={{ color: currentTheme.colors.text }}
                        />
                    </div>
                    
                    {/* List of matches */}
                    <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.background }}>
                        {filteredWithdrawalCollaborators.length > 0 ? (
                            filteredWithdrawalCollaborators.map(c => (
                                <div 
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedCollaboratorId(c.id!);
                                        setWithdrawalCollaboratorSearch(c.name);
                                    }}
                                    className={`p-2 cursor-pointer flex justify-between items-center hover:bg-opacity-10 ${selectedCollaboratorId === c.id ? 'bg-blue-500 bg-opacity-20' : ''}`}
                                    style={{ 
                                        backgroundColor: selectedCollaboratorId === c.id ? `${currentTheme.colors.primary}20` : undefined,
                                        color: currentTheme.colors.text 
                                    }}
                                >
                                    <span>{c.name}</span>
                                    {selectedCollaboratorId === c.id && <Check size={16} className="text-blue-500" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-sm opacity-50 text-center" style={{ color: currentTheme.colors.text }}>
                                {withdrawalCollaboratorSearch ? 'Nenhum colaborador encontrado.' : 'Digite para buscar...'}
                            </div>
                        )}
                    </div>
                </div>
                {siteCollaborators.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhum colaborador cadastrado na obra.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>Item (EPI)</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className={baseInputClass}
                  style={dynamicInputStyle}
                >
                  <option value="">Selecione...</option>
                  {epiItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Disp: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className={baseInputClass}
                  style={dynamicInputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>Observações</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={baseInputClass}
                  style={dynamicInputStyle}
                  placeholder="Opcional..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowWithdrawalModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting || !selectedCollaboratorId}>Confirmar Entrega</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {showAddCollaboratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCollaboratorModal(false)}>
          <div className="w-full max-w-md rounded-xl shadow-2xl border p-6" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: currentTheme.colors.text }}>Adicionar Colaborador à Obra</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>Buscar na Lista Global</label>
                
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
                    <input 
                        value={addCollaboratorSearch}
                        onChange={e => setAddCollaboratorSearch(e.target.value)}
                        placeholder="Nome do colaborador..."
                        className={baseInputClass}
                        style={{ ...dynamicInputStyle, paddingLeft: '2.5rem' }}
                        autoFocus
                    />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y" style={{ borderColor: currentTheme.colors.border }}>
                    {filteredGlobalCollaborators.length > 0 ? (
                        filteredGlobalCollaborators.map(c => (
                            <div key={c.id} className="p-3 flex justify-between items-center hover:bg-opacity-50" style={{ backgroundColor: currentTheme.colors.background }}>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: currentTheme.colors.text }}>{c.nome}</p>
                                    <p className="text-xs opacity-60" style={{ color: currentTheme.colors.textSecondary }}>{c.empresa}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAddCollaborator(c.id!)} disabled={submitting}>
                                    Adicionar
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-sm opacity-50" style={{ color: currentTheme.colors.text }}>
                            {addCollaboratorSearch ? 'Nenhum colaborador encontrado.' : 'Digite para buscar...'}
                        </p>
                    )}
                </div>
                
                <p className="text-xs mt-2 opacity-60" style={{ color: currentTheme.colors.textSecondary }}>Apenas colaboradores não cadastrados nesta obra aparecem aqui.</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddCollaboratorModal(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl border flex flex-col max-h-[85vh]" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
                <h3 className="font-bold" style={{ color: currentTheme.colors.text }}>Histórico: {selectedCollaboratorName}</h3>
                <button onClick={() => setShowHistoryModal(false)}><X size={20} style={{ color: currentTheme.colors.textSecondary }} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
               {selectedCollaboratorHistory.length === 0 ? (
                 <p className="text-center opacity-50 py-8">Nenhuma retirada registrada para este colaborador.</p>
               ) : (
                 <table className="w-full text-left text-sm">
                   <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
                     <tr>
                       <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data</th>
                       <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Item</th>
                       <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Qtd</th>
                       <th className="p-3 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Obs</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
                     {selectedCollaboratorHistory.map(h => (
                       <tr key={h.id}>
                         <td className="p-3" style={{ color: currentTheme.colors.text }}>{format(h.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                         <td className="p-3 font-bold" style={{ color: currentTheme.colors.text }}>{h.itemName}</td>
                         <td className="p-3" style={{ color: currentTheme.colors.text }}>{h.quantity}</td>
                         <td className="p-3 opacity-70" style={{ color: currentTheme.colors.text }}>{h.notes || '-'}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ObraEPI;
