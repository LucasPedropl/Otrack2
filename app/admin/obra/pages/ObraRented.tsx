
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService';
import { RentedEquipment } from '../../../../types';
import { Search, Plus, Truck, Calendar, Camera, X, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

const ObraRented: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();

  const [equipmentList, setEquipmentList] = useState<RentedEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [selectedEq, setSelectedEq] = useState<RentedEquipment | null>(null);

  // Form State
  const [entryData, setEntryData] = useState({ name: '', supplier: '', description: '', entryDate: new Date().toISOString().split('T')[0] });
  const [exitData, setExitData] = useState({ exitDate: new Date().toISOString().split('T')[0] });
  const [photos, setPhotos] = useState<string[]>([]); // Base64 list

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEquipment = async () => {
    if (!siteId) return;
    setIsLoading(true);
    try {
      const data = await rentedEquipmentService.getAll(siteId);
      setEquipmentList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [siteId]);

  // Photo Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) newPhotos.push(reader.result as string);
            if (newPhotos.length === files.length) {
                setPhotos(prev => [...prev, ...newPhotos]);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Handlers
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;
    try {
        await rentedEquipmentService.registerEntry(siteId, {
            name: entryData.name,
            supplier: entryData.supplier,
            description: entryData.description,
            entryDate: new Date(entryData.entryDate),
            entryPhotos: photos
        });
        setIsModalOpen(false);
        fetchEquipment();
    } catch (error) {
        console.error(error);
        alert("Erro ao registrar entrada.");
    }
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !selectedEq) return;
    try {
        await rentedEquipmentService.registerExit(siteId, selectedEq.id!, {
            exitDate: new Date(exitData.exitDate),
            exitPhotos: photos
        });
        setIsModalOpen(false);
        fetchEquipment();
    } catch (error) {
        console.error(error);
        alert("Erro ao registrar devolução.");
    }
  };

  // Open Modal Helpers
  const openEntryModal = () => {
    setModalType('ENTRY');
    setEntryData({ name: '', supplier: '', description: '', entryDate: new Date().toISOString().split('T')[0] });
    setPhotos([]);
    setIsModalOpen(true);
  };

  const openExitModal = (eq: RentedEquipment) => {
    setModalType('EXIT');
    setSelectedEq(eq);
    setExitData({ exitDate: new Date().toISOString().split('T')[0] });
    setPhotos([]);
    setIsModalOpen(true);
  };

  const baseInputClass = "w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors";
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>Equipamentos Alugados</h2>
            <p className="text-sm opacity-70" style={{ color: currentTheme.colors.textSecondary }}>Gerencie contratos de locação, entradas e devoluções.</p>
         </div>
         <Button onClick={openEntryModal} style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Entrada
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {equipmentList.map(eq => (
             <div key={eq.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                 {/* Header */}
                 <div className="p-4 border-b flex justify-between items-start" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
                    <div className="flex gap-3">
                        <div className="p-3 bg-white rounded-lg shadow-sm border h-fit">
                           <Truck className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg" style={{ color: currentTheme.colors.text }}>{eq.name}</h3>
                            <p className="text-sm opacity-70" style={{ color: currentTheme.colors.text }}>Fornecedor: {eq.supplier}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${eq.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {eq.status === 'ACTIVE' ? 'EM OBRA' : 'DEVOLVIDO'}
                    </span>
                 </div>
                 
                 {/* Body */}
                 <div className="p-4 space-y-4">
                     {/* Timeline */}
                     <div className="flex items-center gap-4 text-sm relative">
                        {/* Entry */}
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase opacity-50 mb-1" style={{ color: currentTheme.colors.textSecondary }}>Entrada</p>
                            <div className="flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                                <Calendar size={14} className="text-green-500" />
                                {eq.entryDate.toLocaleDateString()}
                            </div>
                            <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar">
                                {eq.entryPhotos.length > 0 ? eq.entryPhotos.map((p, i) => (
                                    <img key={i} src={p} className="w-10 h-10 object-cover rounded border" alt="Entrada" />
                                )) : <span className="text-xs opacity-50 italic">Sem fotos</span>}
                            </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="opacity-30" />

                        {/* Exit */}
                        <div className="flex-1 text-right">
                            <p className="text-xs font-bold uppercase opacity-50 mb-1" style={{ color: currentTheme.colors.textSecondary }}>Devolução</p>
                            {eq.status === 'ACTIVE' ? (
                                <Button onClick={() => openExitModal(eq)} className="h-8 text-xs bg-orange-500 text-white hover:bg-orange-600">
                                    Registrar Saída
                                </Button>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 justify-end" style={{ color: currentTheme.colors.text }}>
                                        {eq.exitDate?.toLocaleDateString()}
                                        <Calendar size={14} className="text-red-500" />
                                    </div>
                                    <div className="mt-2 flex gap-1 justify-end overflow-x-auto no-scrollbar">
                                        {eq.exitPhotos && eq.exitPhotos.length > 0 ? eq.exitPhotos.map((p, i) => (
                                            <img key={i} src={p} className="w-10 h-10 object-cover rounded border" alt="Saída" />
                                        )) : <span className="text-xs opacity-50 italic">Sem fotos</span>}
                                    </div>
                                </>
                            )}
                        </div>
                     </div>

                     {eq.description && (
                         <div className="pt-2 border-t mt-2" style={{ borderColor: currentTheme.colors.border }}>
                             <p className="text-xs opacity-70" style={{ color: currentTheme.colors.text }}>Obs: {eq.description}</p>
                         </div>
                     )}
                 </div>
             </div>
         ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl shadow-xl border relative p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }} onClick={e => e.stopPropagation()}>
               <h2 className="text-xl font-bold mb-4" style={{ color: currentTheme.colors.text }}>
                  {modalType === 'ENTRY' ? 'Nova Locação (Entrada)' : 'Registrar Devolução'}
               </h2>
               
               <form onSubmit={modalType === 'ENTRY' ? handleEntrySubmit : handleExitSubmit} className="space-y-4">
                  {modalType === 'ENTRY' && (
                      <>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Equipamento *</label>
                            <input required value={entryData.name} onChange={e => setEntryData({...entryData, name: e.target.value})} className={baseInputClass} style={dynamicInputStyle} placeholder="Ex: Betoneira 400L" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Fornecedor *</label>
                            <input required value={entryData.supplier} onChange={e => setEntryData({...entryData, supplier: e.target.value})} className={baseInputClass} style={dynamicInputStyle} placeholder="Ex: Casa do Construtor" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Data de Entrada *</label>
                            <input type="date" required value={entryData.entryDate} onChange={e => setEntryData({...entryData, entryDate: e.target.value})} className={baseInputClass} style={dynamicInputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Descrição / Observações</label>
                            <textarea value={entryData.description} onChange={e => setEntryData({...entryData, description: e.target.value})} className={baseInputClass} style={dynamicInputStyle} rows={2} />
                        </div>
                      </>
                  )}

                  {modalType === 'EXIT' && (
                      <div>
                            <label className="block text-sm mb-1" style={{ color: currentTheme.colors.textSecondary }}>Data de Devolução *</label>
                            <input type="date" required value={exitData.exitDate} onChange={e => setExitData({...exitData, exitDate: e.target.value})} className={baseInputClass} style={dynamicInputStyle} />
                      </div>
                  )}

                  {/* Photos Section */}
                  <div>
                      <label className="block text-sm mb-2 font-bold flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                          <Camera size={16} /> 
                          {modalType === 'ENTRY' ? 'Fotos da Chegada (Vistoria)' : 'Fotos da Devolução'}
                      </label>
                      
                      <div className="grid grid-cols-4 gap-2 mb-2">
                          {photos.map((p, i) => (
                              <div key={i} className="relative group aspect-square">
                                  <img src={p} className="w-full h-full object-cover rounded-lg border" />
                                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X size={12} />
                                  </button>
                              </div>
                          ))}
                          <button 
                             type="button" 
                             onClick={() => fileInputRef.current?.click()}
                             className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:bg-white/5 transition-colors"
                             style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.textSecondary }}
                          >
                             <Camera size={24} className="mb-1" />
                             <span className="text-[10px]">Adicionar</span>
                          </button>
                      </div>
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         accept="image/*" 
                         capture="environment" 
                         multiple 
                         className="hidden" 
                         onChange={handlePhotoUpload} 
                      />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                      <Button type="submit">Confirmar</Button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default ObraRented;
