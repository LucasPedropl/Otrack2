
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { rentedEquipmentService } from '../../../../services/rentedEquipmentService';
import { settingsService } from '../../../../services/settingsService';
import { RentedEquipment, ItemCategory, MeasurementUnit } from '../../../../types';
import { Search, Plus, Truck, Calendar, Camera, X, Check, ArrowRight, Image as ImageIcon, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

const ObraRented: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();

  const [equipmentList, setEquipmentList] = useState<RentedEquipment[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [selectedEq, setSelectedEq] = useState<RentedEquipment | null>(null);

  // Form State
  const [entryData, setEntryData] = useState({ 
    name: '', 
    supplier: '', 
    description: '', 
    entryDate: new Date().toISOString().split('T')[0],
    category: '',
    unit: '',
    quantity: 1
  });
  const [exitData, setExitData] = useState({ exitDate: new Date().toISOString().split('T')[0] });
  const [photos, setPhotos] = useState<string[]>([]); // Base64 list

  // Combobox State
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showUnitOptions, setShowUnitOptions] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEquipment = async () => {
    if (!siteId) return;
    setIsLoading(true);
    try {
      const [data, cats, ms] = await Promise.all([
          rentedEquipmentService.getAll(siteId),
          settingsService.getCategories(),
          settingsService.getUnits()
      ]);
      
      // Ordenar: Ativos primeiro, depois por data de entrada
      const sorted = data.sort((a, b) => {
          if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
          if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
          return b.entryDate.getTime() - a.entryDate.getTime();
      });
      setEquipmentList(sorted);
      setCategories(cats);
      setUnits(ms);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [siteId]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryOptions(false);
      }
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setShowUnitOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            entryPhotos: photos,
            category: entryData.category,
            unit: entryData.unit,
            quantity: entryData.quantity
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
    setEntryData({ 
        name: '', 
        supplier: '', 
        description: '', 
        entryDate: new Date().toISOString().split('T')[0],
        category: '',
        unit: '',
        quantity: 1
    });
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
  const labelStyle = { color: currentTheme.colors.textSecondary };
  const dynamicInputStyle = { 
    backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', 
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text
  };

  // Filtered lists for combobox
  const filteredCategories = categories.filter(c => 
    c.category.toLowerCase().includes((entryData.category || '').toLowerCase())
  );
  
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes((entryData.unit || '').toLowerCase()) ||
    u.abbreviation.toLowerCase().includes((entryData.unit || '').toLowerCase())
  );

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

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors.card }}>
         <table className="w-full text-left text-sm">
            <thead style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
               <tr>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Status</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Equipamento / Fornecedor</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Categoria</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Qtd</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data Entrada</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Data Saída</th>
                  <th className="p-4 font-medium" style={{ color: currentTheme.colors.textSecondary }}>Fotos</th>
                  <th className="p-4 font-medium text-right" style={{ color: currentTheme.colors.textSecondary }}>Ações</th>
               </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
               {equipmentList.length === 0 ? (
                   <tr><td colSpan={8} className="p-8 text-center opacity-50">Nenhum equipamento registrado.</td></tr>
               ) : (
                   equipmentList.map(eq => (
                       <tr key={eq.id} style={{ backgroundColor: currentTheme.colors.card }}>
                           <td className="p-4">
                               <span className={`px-2 py-1 text-xs font-bold rounded inline-flex items-center gap-1 ${eq.status === 'ACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                   {eq.status === 'ACTIVE' ? <AlertTriangle size={12} /> : <Check size={12} />}
                                   {eq.status === 'ACTIVE' ? 'NA OBRA' : 'DEVOLVIDO'}
                               </span>
                           </td>
                           <td className="p-4">
                               <p className="font-bold" style={{ color: currentTheme.colors.text }}>{eq.name}</p>
                               <p className="text-xs opacity-70" style={{ color: currentTheme.colors.textSecondary }}>{eq.supplier}</p>
                               {eq.description && <p className="text-xs italic mt-1" style={{ color: currentTheme.colors.textSecondary }}>"{eq.description}"</p>}
                           </td>
                           <td className="p-4" style={{ color: currentTheme.colors.text }}>
                               {eq.category || '-'}
                           </td>
                           <td className="p-4 font-medium" style={{ color: currentTheme.colors.text }}>
                               {eq.quantity} {eq.unit}
                           </td>
                           <td className="p-4" style={{ color: currentTheme.colors.text }}>{eq.entryDate.toLocaleDateString()}</td>
                           <td className="p-4" style={{ color: currentTheme.colors.text }}>{eq.exitDate ? eq.exitDate.toLocaleDateString() : '-'}</td>
                           <td className="p-4">
                               <div className="flex -space-x-2">
                                   {[...eq.entryPhotos, ...(eq.exitPhotos || [])].slice(0, 3).map((p, i) => (
                                       <img key={i} src={p} className="w-8 h-8 rounded-full border-2 object-cover" style={{ borderColor: currentTheme.colors.card }} />
                                   ))}
                                   {[...eq.entryPhotos, ...(eq.exitPhotos || [])].length > 3 && (
                                       <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] bg-gray-200 text-gray-600" style={{ borderColor: currentTheme.colors.card }}>
                                           +{ [...eq.entryPhotos, ...(eq.exitPhotos || [])].length - 3 }
                                       </div>
                                   )}
                               </div>
                           </td>
                           <td className="p-4 text-right">
                               {eq.status === 'ACTIVE' && (
                                   <Button onClick={() => openExitModal(eq)} variant="secondary" className="text-xs h-8 border-orange-200 hover:bg-orange-50 text-orange-600">
                                       Devolver
                                   </Button>
                               )}
                           </td>
                       </tr>
                   ))
               )}
            </tbody>
         </table>
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
                            <label className="block text-sm mb-1" style={labelStyle}>Equipamento *</label>
                            <input required value={entryData.name} onChange={e => setEntryData({...entryData, name: e.target.value})} className={baseInputClass} style={dynamicInputStyle} placeholder="Ex: Betoneira 400L" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            
                            {/* CATEGORY COMBOBOX */}
                            <div className="relative" ref={categoryRef}>
                                <label className="block text-sm mb-1" style={labelStyle}>Categoria</label>
                                <div className="relative">
                                    <input 
                                        value={entryData.category} 
                                        onChange={e => {
                                            setEntryData({...entryData, category: e.target.value});
                                            setShowCategoryOptions(true);
                                        }}
                                        onFocus={() => setShowCategoryOptions(true)}
                                        className={baseInputClass} 
                                        style={dynamicInputStyle}
                                        placeholder="Selecione ou digite..."
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                                </div>
                                {showCategoryOptions && (
                                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                                        {filteredCategories.map(c => (
                                            <li 
                                                key={c.id} 
                                                onMouseDown={() => {
                                                    setEntryData({...entryData, category: c.category});
                                                    setShowCategoryOptions(false);
                                                }}
                                                className="px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: currentTheme.colors.text }}
                                            >
                                                {c.category}
                                            </li>
                                        ))}
                                        {filteredCategories.length === 0 && <li className="px-3 py-2 text-sm opacity-50" style={{ color: currentTheme.colors.text }}>Nenhuma encontrada. Pressione enter para usar a digitada.</li>}
                                    </ul>
                                )}
                            </div>

                            {/* UNIT COMBOBOX */}
                            <div className="relative" ref={unitRef}>
                                <label className="block text-sm mb-1" style={labelStyle}>Unidade</label>
                                <div className="relative">
                                    <input 
                                        value={entryData.unit} 
                                        onChange={e => {
                                            setEntryData({...entryData, unit: e.target.value});
                                            setShowUnitOptions(true);
                                        }}
                                        onFocus={() => setShowUnitOptions(true)}
                                        className={baseInputClass} 
                                        style={dynamicInputStyle}
                                        placeholder="Selecione ou digite..."
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" style={{ color: currentTheme.colors.text }} />
                                </div>
                                {showUnitOptions && (
                                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg" style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}>
                                        {filteredUnits.map(u => (
                                            <li 
                                                key={u.id} 
                                                onMouseDown={() => {
                                                    setEntryData({...entryData, unit: u.abbreviation});
                                                    setShowUnitOptions(false);
                                                }}
                                                className="px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: currentTheme.colors.text }}
                                            >
                                                {u.name} ({u.abbreviation})
                                            </li>
                                        ))}
                                        {filteredUnits.length === 0 && <li className="px-3 py-2 text-sm opacity-50" style={{ color: currentTheme.colors.text }}>Nenhuma encontrada.</li>}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm mb-1" style={labelStyle}>Quantidade *</label>
                                <input type="number" min="1" required value={entryData.quantity} onChange={e => setEntryData({...entryData, quantity: parseFloat(e.target.value)})} className={baseInputClass} style={dynamicInputStyle} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1" style={labelStyle}>Data de Entrada *</label>
                                <input type="date" required value={entryData.entryDate} onChange={e => setEntryData({...entryData, entryDate: e.target.value})} className={baseInputClass} style={dynamicInputStyle} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1" style={labelStyle}>Fornecedor *</label>
                            <input required value={entryData.supplier} onChange={e => setEntryData({...entryData, supplier: e.target.value})} className={baseInputClass} style={dynamicInputStyle} placeholder="Ex: Casa do Construtor" />
                        </div>
                        
                        <div>
                            <label className="block text-sm mb-1" style={labelStyle}>Descrição / Observações</label>
                            <textarea value={entryData.description} onChange={e => setEntryData({...entryData, description: e.target.value})} className={baseInputClass} style={dynamicInputStyle} rows={2} />
                        </div>
                      </>
                  )}

                  {modalType === 'EXIT' && (
                      <div>
                            <label className="block text-sm mb-1" style={labelStyle}>Data de Devolução *</label>
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
