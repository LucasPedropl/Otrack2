import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Trash2, User } from 'lucide-react';
import { collaboratorService, Collaborator } from '../../../services/collaboratorService';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../contexts/ThemeContext';

interface CollaboratorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Collaborator;
}

const CollaboratorForm: React.FC<CollaboratorFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { currentTheme } = useTheme();
  const [formData, setFormData] = useState<Partial<Collaborator>>({
    empresa: 'Geplano Gestão e Consultoria de Obras LTDA',
    nome: '',
    cpf: '',
    rg: '',
    dtNascimento: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      complemento: '',
      uf: '',
      cidade: ''
    },
    anexos: []
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.fotoUrl) {
        setPhotoPreview(initialData.fotoUrl);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMask = (e: React.ChangeEvent<HTMLInputElement>, mask: (val: string) => string) => {
    const { name, value } = e.target;
    const maskedValue = mask(value);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: maskedValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: maskedValue }));
    }
  };

  const masks = {
    cpf: (val: string) => val.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1'),
    phone: (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1'),
    cep: (val: string) => val.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1'),
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachmentFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fotoUrl = formData.fotoUrl;
      if (photoFile) {
        fotoUrl = await collaboratorService.uploadFile(photoFile, `collaborators/${Date.now()}_${photoFile.name}`);
      }

      const newAttachments = [];
      for (const file of attachmentFiles) {
        const url = await collaboratorService.uploadFile(file, `attachments/${Date.now()}_${file.name}`);
        newAttachments.push({ name: file.name, url, path: `attachments/${Date.now()}_${file.name}` });
      }

      const finalData = {
        ...formData,
        fotoUrl: fotoUrl || null,
        anexos: [...(formData.anexos || []), ...newAttachments]
      } as Collaborator;

      if (initialData?.id) {
        await collaboratorService.update(initialData.id, finalData);
      } else {
        await collaboratorService.create(finalData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving collaborator:', error);
      alert('Erro ao salvar colaborador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border"
        style={{ backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
          <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
            {initialData ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h2>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: currentTheme.colors.textSecondary }}>
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: currentTheme.colors.border }}>
          {['Dados', 'Anexos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent hover:opacity-80'
              }`}
              style={{ 
                color: activeTab === tab.toLowerCase() ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                borderColor: activeTab === tab.toLowerCase() ? currentTheme.colors.primary : 'transparent'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dados' && (
            <>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Empresa *</label>
                    <select
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    >
                      <option value="Geplano Gestão e Consultoria de Obras LTDA">Geplano Gestão e Consultoria de Obras LTDA</option>
                      <option value="Outra">Outra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Nome *</label>
                    <input
                      required
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>CPF</label>
                      <input
                        name="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleMask(e, masks.cpf)}
                        maxLength={14}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                          '--tw-ring-color': currentTheme.colors.primary 
                        } as any}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>RG</label>
                      <input
                        name="rg"
                        value={formData.rg}
                        onChange={handleChange}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                          '--tw-ring-color': currentTheme.colors.primary 
                        } as any}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Dt. Nascimento</label>
                      <input
                        type="date"
                        name="dtNascimento"
                        value={formData.dtNascimento}
                        onChange={handleChange}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                          '--tw-ring-color': currentTheme.colors.primary 
                        } as any}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Telefone *</label>
                      <input
                        required
                        name="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleMask(e, masks.phone)}
                        maxLength={15}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                          '--tw-ring-color': currentTheme.colors.primary 
                        } as any}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Celular</label>
                      <input
                        name="celular"
                        value={formData.celular}
                        onChange={(e) => handleMask(e, masks.phone)}
                        maxLength={15}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                          '--tw-ring-color': currentTheme.colors.primary 
                        } as any}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                </div>

                <div className="w-full md:w-48 flex flex-col items-center gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                    style={{ 
                      backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      borderColor: currentTheme.colors.border 
                    }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} style={{ color: currentTheme.colors.textSecondary }} />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Foto do Perfil</span>
                </div>
              </div>

              <div className="border-t pt-6" style={{ borderColor: currentTheme.colors.border }}>
                <h3 className="text-lg font-medium mb-4" style={{ color: currentTheme.colors.text }}>Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>CEP</label>
                    <input
                      name="endereco.cep"
                      value={formData.endereco?.cep}
                      onChange={(e) => handleMask(e, masks.cep)}
                      maxLength={9}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Logradouro</label>
                    <input
                      name="endereco.logradouro"
                      value={formData.endereco?.logradouro}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Número</label>
                    <input
                      name="endereco.numero"
                      value={formData.endereco?.numero}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Bairro</label>
                    <input
                      name="endereco.bairro"
                      value={formData.endereco?.bairro}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Complemento</label>
                    <input
                      name="endereco.complemento"
                      value={formData.endereco?.complemento}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>UF</label>
                    <select
                      name="endereco.uf"
                      value={formData.endereco?.uf}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    >
                      <option value="">Selecione...</option>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Cidade</label>
                    <input
                      name="endereco.cidade"
                      value={formData.endereco?.cidade}
                      onChange={handleChange}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        '--tw-ring-color': currentTheme.colors.primary 
                      } as any}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'anexos' && (
            <div className="space-y-6">
              <div 
                onClick={() => attachmentInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
                style={{ 
                  borderColor: currentTheme.colors.border,
                  backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'
                }}
              >
                <Upload className="mb-2" size={32} style={{ color: currentTheme.colors.textSecondary }} />
                <p className="font-medium" style={{ color: currentTheme.colors.text }}>Clique para adicionar arquivos</p>
                <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Documentos, contratos, certificados...</p>
                <input 
                  type="file" 
                  multiple 
                  ref={attachmentInputRef} 
                  className="hidden" 
                  onChange={handleAttachmentChange}
                />
              </div>

              <div className="space-y-2">
                {formData.anexos?.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: currentTheme.colors.border }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: currentTheme.colors.primary }} />
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: currentTheme.colors.text }}>
                        {file.name}
                      </a>
                    </div>
                  </div>
                ))}
                
                {attachmentFiles.map((file, index) => (
                  <div key={`new-${index}`} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: currentTheme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderColor: currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: currentTheme.colors.primary }} />
                      <span className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>{file.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: currentTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', color: currentTheme.colors.primary }}>Novo</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="hover:text-red-500"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="p-6 border-t flex justify-end gap-3 rounded-b-xl" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorForm;
