import React, { useState, useEffect } from 'react';
import { LayoutProps, ConstructionSite } from '../../types';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, Building2, Calculator, ShieldCheck, ChevronDown, ChevronUp, Users, FileText, Ruler, Tag, ArrowLeft, FolderDot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import { SettingsProvider, useSettingsSidebar } from '../../contexts/SettingsContext';
import { TopBar } from './TopBar';
import { constructionService } from '../../services/constructionService';

// Define paths that belong to the settings menu context
const SETTINGS_PATHS = [
  '/admin/insumos',
  '/admin/unidades',
  '/admin/categorias',
  '/admin/perfis',
  '/admin/usuarios',
  '/admin/settings'
];

// Inner component that consumes both SidebarContext and SettingsContext
const AdminLayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  
  // Contexts
  const { isCollapsed: isPrimaryCollapsed, toggleSidebar: togglePrimarySidebar } = useSidebar();
  const { 
    isSettingsOpen, 
    isSettingsCollapsed,
    toggleSettingsOpen, 
    toggleSettingsCollapse,
    openSettings,
    closeSettings
  } = useSettingsSidebar();
  
  // Sites State
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  
  // Tooltip State
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; top: number, left: number } | null>(null);

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

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleTooltip = (e: React.MouseEvent<HTMLElement>, label: string, sidebarType: 'primary' | 'secondary') => {
    // Show if primary is collapsed OR secondary is collapsed
    if (sidebarType === 'primary' && !isPrimaryCollapsed) return;
    if (sidebarType === 'secondary' && !isSettingsCollapsed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + (rect.height / 2),
      left: rect.right + 10
    });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  // Main Navigation (System Pages)
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Gerenciar Obras', path: '/admin/obras' },
  ];

  const handlePrimaryNavigate = (path: string) => {
    navigate(path);
    if (isSettingsOpen) {
       // Optional: Auto close settings on nav? For now keep behavior simple
       // closeSettings();
    }
  };

  const handleSettingsNavigate = (path: string) => {
    navigate(path);
  };

  // Logic to determine what to show in the main content area
  const isSettingsPath = SETTINGS_PATHS.includes(location.pathname);
  const showContent = !isSettingsOpen || (isSettingsOpen && isSettingsPath);
  
  // Show strip if we are in settings mode or path
  const showToggleStrip = isSettingsOpen || isSettingsPath;

  // Use box-shadow for border to prevent anti-aliasing artifacts (serrated lines)
  const borderStyle = {
    boxShadow: `1px 0 0 0 ${currentTheme.colors.border}`,
    borderRight: 'none' 
  };

  return (
    <div 
      className="h-screen flex flex-row overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* 1. PRIMARY SIDEBAR (Full Height, Left) */}
      <aside 
        className={`flex-shrink-0 transition-all duration-300 flex flex-col relative z-40 ${isPrimaryCollapsed ? 'w-20' : 'w-full md:w-64'}`}
        style={{ 
          backgroundColor: currentTheme.colors.sidebar, 
          color: currentTheme.colors.sidebarText,
          ...borderStyle
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={togglePrimarySidebar}
          className="absolute hidden md:flex items-center justify-center h-6 w-6 rounded-lg border border-solid shadow-sm z-50 transition-colors"
          style={{ 
            top: '81px',
            right: '-12px',
            transform: 'translateY(-50%)',
            backgroundColor: currentTheme.colors.card, 
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text
          }}
        >
          {isPrimaryCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo/Header Area */}
        <div 
          className={`h-[81px] p-6 flex items-center border-b border-solid transition-all ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'}`}
          style={{ borderColor: currentTheme.colors.border }}
        >
          <HardHat className="h-8 w-8 flex-shrink-0" style={{ color: currentTheme.colors.primary }} />
          {!isPrimaryCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold tracking-tight">ObraLog</h1>
              <p className="text-xs opacity-70">Gestão de Obra</p>
            </div>
          )}
        </div>

        {/* Primary Nav Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handlePrimaryNavigate(item.path)}
                onMouseEnter={(e) => handleTooltip(e, item.label, 'primary')}
                onMouseLeave={handleTooltipLeave}
                className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
                style={{
                  backgroundColor: 'transparent',
                  color: isActive ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                }}
              >
                <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                     style={{ opacity: isActive ? 1 : 0.6 }}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isPrimaryCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </div>
              </button>
            );
          })}

          {/* SEPARATOR: Projects */}
          <div className="pt-4 mt-2">
            {!isPrimaryCollapsed && (
              <p className="px-4 text-xs font-bold uppercase tracking-wider mb-2 opacity-50">
                Obras Ativas
              </p>
            )}
            {isPrimaryCollapsed && <div className="border-t mx-4 mb-4 opacity-20" style={{ borderColor: currentTheme.colors.sidebarText }}></div>}
            
            <div className="space-y-1">
              {sites.map((site) => {
                const isActive = location.pathname.startsWith(`/admin/obra/${site.id}`);
                return (
                  <button
                    key={site.id}
                    onClick={() => handlePrimaryNavigate(`/admin/obra/${site.id}`)}
                    onMouseEnter={(e) => handleTooltip(e, site.name, 'primary')}
                    onMouseLeave={handleTooltipLeave}
                    className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2 rounded-lg transition-all hover:bg-white/5`}
                    style={{
                      backgroundColor: 'transparent',
                      color: isActive ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                    }}
                  >
                    <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                         style={{ opacity: isActive ? 1 : 0.6 }}>
                      <FolderDot className="h-4 w-4 flex-shrink-0" />
                      {!isPrimaryCollapsed && <span className="font-medium whitespace-nowrap text-sm truncate">{site.name}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Generic Settings Link */}
        <div 
          className="p-4 border-t border-solid"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <button
            onClick={() => handlePrimaryNavigate('/admin/settings')}
            onMouseEnter={(e) => handleTooltip(e, 'Aparência', 'primary')}
            onMouseLeave={handleTooltipLeave}
            className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
            style={{
              backgroundColor: 'transparent',
              color: location.pathname === '/admin/settings' ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
            }}
          >
            <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                 style={{ opacity: location.pathname === '/admin/settings' ? 1 : 0.6 }}>
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isPrimaryCollapsed && <span className="font-medium whitespace-nowrap">Aparência</span>}
            </div>
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP BAR */}
        <TopBar onToggleSettings={toggleSettingsOpen} isSettingsOpen={isSettingsOpen} />

        {/* CONTENT ROW */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* 2. SECONDARY SIDEBAR (SETTINGS PANEL) */}
          <aside
            className={`flex-shrink-0 transition-all duration-300 overflow-y-auto flex flex-col z-20 
              ${isSettingsOpen ? (isSettingsCollapsed ? 'w-20' : 'w-64') : 'w-0 overflow-hidden'}
            `}
            style={{ 
                backgroundColor: currentTheme.colors.background === '#f8fafc' ? '#ffffff' : currentTheme.colors.sidebar,
                // Apply shadow border instead of border-r
                boxShadow: isSettingsOpen ? `1px 0 0 0 ${currentTheme.colors.border}` : 'none',
                height: '100%',
                opacity: isSettingsOpen ? 1 : 0,
                transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}
          >
            {/* Spacer */}
            <div className="h-4"></div>

            <div className="p-4 space-y-6">
               {/* GROUP 1: ORÇAMENTO */}
               <div>
                  <button 
                    onClick={() => toggleMenu('orcamento')}
                    onMouseEnter={(e) => handleTooltip(e, 'Orçamento', 'secondary')}
                    onMouseLeave={handleTooltipLeave}
                    className={`w-full flex items-center mb-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isSettingsCollapsed ? 'justify-center' : 'justify-between'}`}
                  >
                     <div className={`flex items-center gap-2 font-semibold ${isSettingsCollapsed ? 'justify-center' : ''}`} style={{ color: currentTheme.colors.text }}>
                        <Calculator size={18} />
                        {!isSettingsCollapsed && <span>Orçamento</span>}
                     </div>
                     {!isSettingsCollapsed && (openMenus['orcamento'] ? <ChevronUp size={14} style={{ color: currentTheme.colors.textSecondary }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.textSecondary }} />)}
                  </button>

                  {/* Show children if menu is open OR if sidebar is collapsed (so user can access them) */}
                  {(openMenus['orcamento'] || isSettingsCollapsed) && (
                    <div className={`space-y-1 ${isSettingsCollapsed ? '' : 'ml-4 pl-4 border-l border-solid'}`} style={{ borderColor: currentTheme.colors.border }}>
                       <button 
                          onClick={() => handleSettingsNavigate('/admin/insumos')} 
                          onMouseEnter={(e) => handleTooltip(e, 'Insumos', 'secondary')}
                          onMouseLeave={handleTooltipLeave}
                          className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/insumos' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${isSettingsCollapsed ? 'flex justify-center px-0' : ''}`} 
                          style={{ color: location.pathname === '/admin/insumos' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                       >
                          <div className={`flex items-center gap-2 ${isSettingsCollapsed ? 'justify-center' : ''}`}>
                            <FileText size={14} />
                            {!isSettingsCollapsed && 'Insumos'}
                          </div>
                       </button>
                       <button 
                          onClick={() => handleSettingsNavigate('/admin/unidades')} 
                          onMouseEnter={(e) => handleTooltip(e, 'Unid. de Medidas', 'secondary')}
                          onMouseLeave={handleTooltipLeave}
                          className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/unidades' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${isSettingsCollapsed ? 'flex justify-center px-0' : ''}`} 
                          style={{ color: location.pathname === '/admin/unidades' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                       >
                          <div className={`flex items-center gap-2 ${isSettingsCollapsed ? 'justify-center' : ''}`}>
                            <Ruler size={14} />
                            {!isSettingsCollapsed && 'Unid. de Medidas'}
                          </div>
                       </button>
                       <button 
                          onClick={() => handleSettingsNavigate('/admin/categorias')} 
                          onMouseEnter={(e) => handleTooltip(e, 'Categorias', 'secondary')}
                          onMouseLeave={handleTooltipLeave}
                          className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/categorias' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${isSettingsCollapsed ? 'flex justify-center px-0' : ''}`} 
                          style={{ color: location.pathname === '/admin/categorias' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                       >
                          <div className={`flex items-center gap-2 ${isSettingsCollapsed ? 'justify-center' : ''}`}>
                            <Tag size={14} />
                            {!isSettingsCollapsed && 'Categorias'}
                          </div>
                       </button>
                    </div>
                  )}
               </div>

               {/* GROUP 2: ACESSO AO SISTEMA */}
               <div>
                  <button 
                    onClick={() => toggleMenu('acesso')}
                    onMouseEnter={(e) => handleTooltip(e, 'Acesso ao sistema', 'secondary')}
                    onMouseLeave={handleTooltipLeave}
                    className={`w-full flex items-center mb-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isSettingsCollapsed ? 'justify-center' : 'justify-between'}`}
                  >
                     <div className={`flex items-center gap-2 font-semibold ${isSettingsCollapsed ? 'justify-center' : ''}`} style={{ color: currentTheme.colors.text }}>
                        <ShieldCheck size={18} />
                        {!isSettingsCollapsed && <span>Acesso ao sistema</span>}
                     </div>
                     {!isSettingsCollapsed && (openMenus['acesso'] ? <ChevronUp size={14} style={{ color: currentTheme.colors.textSecondary }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.textSecondary }} />)}
                  </button>

                  {(openMenus['acesso'] || isSettingsCollapsed) && (
                    <div className={`space-y-1 ${isSettingsCollapsed ? '' : 'ml-4 pl-4 border-l border-solid'}`} style={{ borderColor: currentTheme.colors.border }}>
                       <button 
                          onClick={() => handleSettingsNavigate('/admin/perfis')} 
                          onMouseEnter={(e) => handleTooltip(e, 'Perfis de acesso', 'secondary')}
                          onMouseLeave={handleTooltipLeave}
                          className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/perfis' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${isSettingsCollapsed ? 'flex justify-center px-0' : ''}`} 
                          style={{ color: location.pathname === '/admin/perfis' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                       >
                          <div className={`flex items-center gap-2 ${isSettingsCollapsed ? 'justify-center' : ''}`}>
                            <ShieldCheck size={14} />
                            {!isSettingsCollapsed && 'Perfis de acesso'}
                          </div>
                       </button>
                       <button 
                          onClick={() => handleSettingsNavigate('/admin/usuarios')} 
                          onMouseEnter={(e) => handleTooltip(e, 'Usuários', 'secondary')}
                          onMouseLeave={handleTooltipLeave}
                          className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/usuarios' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${isSettingsCollapsed ? 'flex justify-center px-0' : ''}`} 
                          style={{ color: location.pathname === '/admin/usuarios' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}
                       >
                          <div className={`flex items-center gap-2 ${isSettingsCollapsed ? 'justify-center' : ''}`}>
                            <Users size={14} />
                            {!isSettingsCollapsed && 'Usuários do sistema'}
                          </div>
                       </button>
                    </div>
                  )}
               </div>
            </div>
          </aside>

          {/* TOGGLE STRIP (Toggles collapse state) */}
          {showToggleStrip && (
            <div 
              className="relative flex-shrink-0 z-30 flex items-center justify-start cursor-pointer group"
              style={{ width: '12px', marginLeft: '-1px' }}
              onClick={toggleSettingsCollapse} // CHANGED: Toggles collapse instead of open/close
              title={isSettingsCollapsed ? "Expandir Menu" : "Reduzir Menu"}
            >
              <div 
                className="absolute top-0 bottom-0 left-0 w-[1px] group-hover:w-[2px] transition-all duration-200"
                style={{ backgroundColor: currentTheme.colors.border }}
              />
              <div 
                className="relative w-5 h-10 flex items-center justify-center rounded-r-md shadow-sm border-t border-r border-b border-solid transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ 
                  backgroundColor: currentTheme.colors.card,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.textSecondary
                }}
              >
                  {isSettingsCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </div>
            </div>
          )}

          {/* 3. MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative w-full h-full">
            {showContent ? (
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
                   onClick={closeSettings}
                   className="mt-8 flex items-center gap-2 text-sm hover:underline opacity-70 hover:opacity-100"
                   style={{ color: currentTheme.colors.text }}>
                   <ArrowLeft size={16} />
                   Voltar para tela anterior
                </button>
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Global Fixed Tooltip */}
      {hoveredTooltip && (
           <div 
             className="fixed px-3 py-1.5 rounded-md text-xs font-medium z-[100] shadow-lg border border-solid animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap pointer-events-none"
             style={{ 
               top: hoveredTooltip.top,
               left: hoveredTooltip.left,
               transform: 'translateY(-50%)',
               backgroundColor: currentTheme.colors.card,
               color: currentTheme.colors.text,
               borderColor: currentTheme.colors.border
             }}
           >
             {hoveredTooltip.label}
           </div>
      )}
    </div>
  );
};

export const AdminLayout: React.FC<LayoutProps> = (props) => {
  return (
    <SidebarProvider>
      <SettingsProvider>
        <AdminLayoutContent {...props} />
      </SettingsProvider>
    </SidebarProvider>
  );
};