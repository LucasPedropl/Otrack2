import React, { useState, useEffect } from 'react';
import { LayoutProps, ConstructionSite } from '../../types';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, Building2, Calculator, ShieldCheck, ChevronDown, ChevronUp, Users, FileText, Ruler, Tag, ArrowLeft, FolderDot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { TopBar } from './TopBar';
import { constructionService } from '../../services/constructionService';

// Define paths that belong to the settings menu context
const SETTINGS_PATHS = [
  '/admin/insumos',
  '/admin/unidades',
  '/admin/categorias',
  '/admin/perfis',
  '/admin/usuarios',
  '/admin/settings' // Generic settings page
];

export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  
  // Sites State
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  
  // Main Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('obralog_sidebar_collapsed');
    return saved === 'true';
  });

  // Settings Sidebar State
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('obralog_settings_open');
    return saved === 'true'; 
  });

  // Accordion State for Settings Menu
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    orcamento: true,
    acesso: true
  });

  // Fetch sites for sidebar
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await constructionService.getAll();
        setSites(data);
      } catch (error) {
        console.error("Failed to fetch sites for sidebar", error);
      }
    };
    fetchSites();
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('obralog_sidebar_collapsed', String(newState));
  };

  const toggleSettings = () => {
    const newState = !isSettingsOpen;
    setIsSettingsOpen(newState);
    localStorage.setItem('obralog_settings_open', String(newState));
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Main Navigation (System Pages)
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Gerenciar Obras', path: '/admin/obras' },
  ];

  const handlePrimaryNavigate = (path: string) => {
    navigate(path);
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      localStorage.setItem('obralog_settings_open', 'false');
    }
  };

  const handleSettingsNavigate = (path: string) => {
    navigate(path);
  };

  // Logic to determine what to show in the main content area
  const isSettingsPath = SETTINGS_PATHS.includes(location.pathname);
  const showContent = !isSettingsOpen || (isSettingsOpen && isSettingsPath);
  
  const showToggleStrip = isSettingsOpen || isSettingsPath;

  return (
    <div 
      className="h-screen flex flex-row overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* 1. PRIMARY SIDEBAR (Full Height, Left) */}
      <aside 
        className={`flex-shrink-0 transition-all duration-300 border-r flex flex-col relative z-40 ${isCollapsed ? 'w-20' : 'w-full md:w-64'}`}
        style={{ 
          backgroundColor: currentTheme.colors.sidebar, 
          color: currentTheme.colors.sidebarText,
          borderColor: currentTheme.colors.border
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute hidden md:flex items-center justify-center h-6 w-6 rounded-lg border shadow-sm z-50 transition-colors"
          style={{ 
            top: '81px',
            right: '-12px',
            transform: 'translateY(-50%)',
            backgroundColor: currentTheme.colors.card, 
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo/Header Area */}
        <div 
          className={`h-[81px] p-6 flex items-center border-b transition-all ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
          style={{ borderColor: currentTheme.colors.border }}
        >
          <HardHat className="h-8 w-8 flex-shrink-0" style={{ color: currentTheme.colors.primary }} />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold tracking-tight">ObraLog</h1>
              <p className="text-xs opacity-70">Gestão de Obra</p>
            </div>
          )}
        </div>

        {/* Primary Nav Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {/* System Pages */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handlePrimaryNavigate(item.path)}
                className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
                style={{
                  backgroundColor: 'transparent',
                  color: isActive ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                }}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                     style={{ opacity: isActive ? 1 : 0.6 }}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </div>
                
                {isCollapsed && (
                  <div 
                    className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md border"
                    style={{ 
                      backgroundColor: currentTheme.colors.card,
                      color: currentTheme.colors.text,
                      borderColor: currentTheme.colors.border
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}

          {/* SEPARATOR: Projects/Obras */}
          <div className="pt-4 mt-2">
            {!isCollapsed && (
              <p className="px-4 text-xs font-bold uppercase tracking-wider mb-2 opacity-50">
                Obras Ativas
              </p>
            )}
            {isCollapsed && <div className="border-t mx-4 mb-4 opacity-20" style={{ borderColor: currentTheme.colors.sidebarText }}></div>}
            
            <div className="space-y-1">
              {sites.map((site) => {
                const isActive = location.pathname.startsWith(`/admin/obra/${site.id}`);
                return (
                  <button
                    key={site.id}
                    onClick={() => handlePrimaryNavigate(`/admin/obra/${site.id}`)}
                    className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2 rounded-lg transition-all hover:bg-white/5`}
                    style={{
                      backgroundColor: 'transparent',
                      color: isActive ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                    }}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                         style={{ opacity: isActive ? 1 : 0.6 }}>
                      <FolderDot className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm truncate">{site.name}</span>}
                    </div>

                    {isCollapsed && (
                      <div 
                        className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md border"
                        style={{ 
                          backgroundColor: currentTheme.colors.card,
                          color: currentTheme.colors.text,
                          borderColor: currentTheme.colors.border
                        }}
                      >
                        {site.name}
                      </div>
                    )}
                  </button>
                );
              })}
              
              {sites.length === 0 && !isCollapsed && (
                <p className="px-4 text-xs opacity-40 italic">Nenhuma obra cadastrada</p>
              )}
            </div>
          </div>
        </nav>

        {/* Generic Settings Link in Primary Sidebar */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <button
            onClick={() => handlePrimaryNavigate('/admin/settings')}
            className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
            style={{
              backgroundColor: 'transparent',
              color: location.pathname === '/admin/settings' ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
            }}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                 style={{ opacity: location.pathname === '/admin/settings' ? 1 : 0.6 }}>
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">Aparência</span>}
            </div>
             {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md border" style={{ backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }}>
                    Aparência
                  </div>
              )}
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP BAR */}
        <TopBar onToggleSettings={toggleSettings} isSettingsOpen={isSettingsOpen} />

        {/* CONTENT ROW (Settings Sidebar + Toggle + Page Content) */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* 2. SECONDARY SIDEBAR (SETTINGS PANEL) */}
          <aside
            className={`flex-shrink-0 transition-all duration-300 border-r overflow-y-auto flex flex-col z-20 ${isSettingsOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden border-none'}`}
            style={{ 
                backgroundColor: currentTheme.colors.background === '#f8fafc' ? '#ffffff' : currentTheme.colors.sidebar,
                borderColor: currentTheme.colors.border,
                height: '100%' 
            }}
          >
            <div className="p-4 space-y-6 mt-2">
               {/* GROUP 1: ORÇAMENTO */}
               <div>
                  <button 
                    onClick={() => toggleMenu('orcamento')}
                    className="w-full flex items-center justify-between mb-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                     <div className="flex items-center gap-2 font-semibold" style={{ color: currentTheme.colors.text }}>
                        <Calculator size={18} />
                        <span>Orçamento</span>
                     </div>
                     {openMenus['orcamento'] ? <ChevronUp size={14} style={{ color: currentTheme.colors.textSecondary }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.textSecondary }} />}
                  </button>

                  {openMenus['orcamento'] && (
                    <div className="space-y-1 ml-4 pl-4 border-l" style={{ borderColor: currentTheme.colors.border }}>
                       <button onClick={() => handleSettingsNavigate('/admin/insumos')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/insumos' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/insumos' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            Insumos
                          </div>
                       </button>
                       <button onClick={() => handleSettingsNavigate('/admin/unidades')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/unidades' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/unidades' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                          <div className="flex items-center gap-2">
                            <Ruler size={14} />
                            Unid. de Medidas
                          </div>
                       </button>
                       <button onClick={() => handleSettingsNavigate('/admin/categorias')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/categorias' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/categorias' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                          <div className="flex items-center gap-2">
                            <Tag size={14} />
                            Categorias
                          </div>
                       </button>
                    </div>
                  )}
               </div>

               {/* GROUP 2: ACESSO AO SISTEMA */}
               <div>
                  <button 
                    onClick={() => toggleMenu('acesso')}
                    className="w-full flex items-center justify-between mb-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                     <div className="flex items-center gap-2 font-semibold" style={{ color: currentTheme.colors.text }}>
                        <ShieldCheck size={18} />
                        <span>Acesso ao sistema</span>
                     </div>
                     {openMenus['acesso'] ? <ChevronUp size={14} style={{ color: currentTheme.colors.textSecondary }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.textSecondary }} />}
                  </button>

                  {openMenus['acesso'] && (
                    <div className="space-y-1 ml-4 pl-4 border-l" style={{ borderColor: currentTheme.colors.border }}>
                       <button onClick={() => handleSettingsNavigate('/admin/perfis')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/perfis' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/perfis' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} />
                            Perfis de acesso
                          </div>
                       </button>
                       <button onClick={() => handleSettingsNavigate('/admin/usuarios')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/usuarios' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/usuarios' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            Usuários do sistema
                          </div>
                       </button>
                    </div>
                  )}
               </div>
            </div>
          </aside>

          {/* TOGGLE STRIP */}
          {showToggleStrip && (
            <div 
              className="relative flex-shrink-0 z-30 flex items-center justify-start cursor-pointer group"
              style={{ width: '12px', marginLeft: '-1px' }}
              onClick={toggleSettings}
              title={isSettingsOpen ? "Fechar Menu" : "Abrir Menu"}
            >
              <div 
                className="absolute top-0 bottom-0 left-0 w-[1px] group-hover:w-[2px] transition-all duration-200"
                style={{ backgroundColor: currentTheme.colors.border }}
              />
              <div 
                className="relative w-5 h-10 flex items-center justify-center rounded-r-md shadow-sm border-t border-r border-b transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ 
                  backgroundColor: currentTheme.colors.card,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.textSecondary
                }}
              >
                  {isSettingsOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
          )}

          {/* 3. MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative w-full h-full">
            {showContent ? (
              // If it's an Obra page, we remove padding to allow the Obra layout to handle full width
              <div className={location.pathname.startsWith('/admin/obra/') ? "" : "p-8"}>
                {children}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fadeIn">
                <div 
                  className="p-6 rounded-full mb-6"
                  style={{ backgroundColor: `${currentTheme.colors.primary}10` }}
                >
                  <Settings size={48} style={{ color: currentTheme.colors.primary, opacity: 0.5 }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text }}>
                  Menu de Configurações
                </h2>
                <p className="max-w-md" style={{ color: currentTheme.colors.textSecondary }}>
                  Selecione uma opção no menu lateral para gerenciar os cadastros e configurações do sistema.
                </p>
                <button 
                   onClick={() => setIsSettingsOpen(false)}
                   className="mt-8 flex items-center gap-2 text-sm hover:underline opacity-70 hover:opacity-100"
                   style={{ color: currentTheme.colors.text }}
                >
                   <ArrowLeft size={16} />
                   Voltar para tela anterior
                </button>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};