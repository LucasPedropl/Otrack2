import React, { useState, useEffect, useRef } from 'react';
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

// Configuration for Settings Menus
const SETTINGS_MENUS = [
  {
    id: 'orcamento',
    label: 'Orçamento',
    icon: Calculator,
    items: [
      { label: 'Insumos', path: '/admin/insumos', icon: FileText },
      { label: 'Unid. de Medidas', path: '/admin/unidades', icon: Ruler },
      { label: 'Categorias', path: '/admin/categorias', icon: Tag },
    ]
  },
  {
    id: 'acesso',
    label: 'Acesso ao sistema',
    icon: ShieldCheck,
    items: [
      { label: 'Perfis de acesso', path: '/admin/perfis', icon: ShieldCheck },
      { label: 'Usuários', path: '/admin/usuarios', icon: Users },
    ]
  }
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
  
  // Tooltip/Floating Menu State
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; top: number, left: number } | null>(null);
  const [hoveredSettingsMenu, setHoveredSettingsMenu] = useState<string | null>(null);
  const [hoveredMenuPosition, setHoveredMenuPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Ref to handle the delay/grace period for the floating menu
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accordion State for Settings Menu (Expanded Mode)
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

  // Sync Sidebar State with Route
  useEffect(() => {
    // Only auto-open settings sidebar for sub-modules (like Insumos, Users),
    // NOT for the main Appearance/Theme page ('/admin/settings').
    const autoOpenPaths = SETTINGS_PATHS.filter(path => path !== '/admin/settings');
    const shouldAutoOpen = autoOpenPaths.some(path => location.pathname.startsWith(path));

    if (shouldAutoOpen && !isSettingsOpen) {
      openSettings();
    }
  }, [location.pathname, isSettingsOpen, openSettings]);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleTooltip = (e: React.MouseEvent<HTMLElement>, label: string, sidebarType: 'primary') => {
    if (sidebarType === 'primary' && !isPrimaryCollapsed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + (rect.height / 2),
      left: rect.right + 10
    });
  };

  const handleSettingsMenuHover = (e: React.MouseEvent<HTMLElement>, menuId: string) => {
    if (!isSettingsCollapsed) return; // Only show floating menu when collapsed

    // Clear any pending close timer when entering the item
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSettingsMenu(menuId);
    setHoveredMenuPosition({
      top: rect.top,
      left: rect.right // Position right next to the secondary sidebar
    });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const handleSettingsMenuLeave = () => {
    // Instead of closing immediately, set a timeout to allow the user to move to the floating menu
    hoverTimeoutRef.current = setTimeout(() => {
        setHoveredSettingsMenu(null);
        setHoveredMenuPosition(null);
    }, 300); // 300ms grace period
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Gerenciar Obras', path: '/admin/obras' },
  ];

  const handlePrimaryNavigate = (path: string) => {
    navigate(path);
    if (isSettingsOpen) {
       closeSettings();
    }
  };

  const handleSettingsNavigate = (path: string) => {
    navigate(path);
  };

  const isSettingsPath = SETTINGS_PATHS.includes(location.pathname);
  const showContent = !isSettingsOpen || (isSettingsOpen && isSettingsPath);
  const showToggleStrip = isSettingsOpen || isSettingsPath;

  // Shared Logic for Sidebar Item Styles (Primary and Secondary)
  const getSidebarItemStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 
        (currentTheme.isDark || ['#000000', '#09090b', '#18181b'].includes(currentTheme.colors.sidebar) ? 'rgba(255,255,255,0.12)' : `${currentTheme.colors.primary}15`) 
        : 'transparent',
    color: currentTheme.colors.sidebarText,
    opacity: isActive ? 1 : 0.7,
    fontWeight: isActive ? 600 : 400
  });

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
        }}
      >
        {/* Physical Border Line (Right) - Using opacity for subtle look on dark sidebars */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[1px] z-50"
          style={{ 
            backgroundColor: currentTheme.colors.sidebarText, 
            opacity: 0.12 
          }}
        />

        {/* Toggle Button */}
        <button
          onClick={togglePrimarySidebar}
          className="absolute hidden md:flex items-center justify-center h-6 w-6 rounded-lg border border-solid shadow-sm z-50 transition-colors"
          style={{ 
            top: '81px',
            right: '-12px',
            transform: 'translateY(-50%)',
            backgroundColor: currentTheme.colors.sidebar, 
            borderColor: `${currentTheme.colors.sidebarText}1F`,
            color: currentTheme.colors.sidebarText
          }}
        >
          {isPrimaryCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo/Header Area */}
        <div 
          className={`h-[81px] p-6 flex items-center transition-all ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} relative`}
        >
          {/* Bottom Border for Header - Subtle opacity */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[1px]" 
            style={{ 
              backgroundColor: currentTheme.colors.sidebarText, 
              opacity: 0.12 
            }} 
          />

          <HardHat className="h-8 w-8 flex-shrink-0" style={{ color: currentTheme.colors.sidebarText }} />
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
                style={getSidebarItemStyle(isActive)}
              >
                <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isPrimaryCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
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
            {/* Separator line with opacity */}
            {isPrimaryCollapsed && (
              <div 
                className="border-t mx-4 mb-4" 
                style={{ 
                  borderColor: currentTheme.colors.sidebarText, 
                  opacity: 0.12 
                }}
              ></div>
            )}
            
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
                    style={getSidebarItemStyle(isActive)}
                  >
                    <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
                      <FolderDot className="h-4 w-4 flex-shrink-0" />
                      {!isPrimaryCollapsed && <span className="whitespace-nowrap text-sm truncate">{site.name}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Generic Settings Link */}
        <div className="p-4 relative">
          {/* Top Border for Settings - Subtle opacity */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]" 
            style={{ 
              backgroundColor: currentTheme.colors.sidebarText, 
              opacity: 0.12 
            }} 
          />
          
          <button
            onClick={() => handlePrimaryNavigate('/admin/settings')}
            onMouseEnter={(e) => handleTooltip(e, 'Aparência', 'primary')}
            onMouseLeave={handleTooltipLeave}
            className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
            style={getSidebarItemStyle(location.pathname === '/admin/settings')}
          >
            <div className={`flex items-center ${isPrimaryCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isPrimaryCollapsed && <span className="whitespace-nowrap">Aparência</span>}
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
            className={`flex-shrink-0 transition-all duration-300 overflow-visible flex flex-col z-20 relative
              ${isSettingsOpen ? (isSettingsCollapsed ? 'w-20' : 'w-64') : 'w-0 overflow-hidden'}
            `}
            style={{ 
                // Now strictly uses sidebar background color to match the primary sidebar
                backgroundColor: currentTheme.colors.sidebar,
                color: currentTheme.colors.sidebarText,
                height: '100%',
                opacity: isSettingsOpen ? 1 : 0,
                transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}
          >
            {/* Physical Border Line for Secondary Sidebar */}
            {isSettingsOpen && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-[1px] z-50"
                style={{ 
                   backgroundColor: currentTheme.colors.sidebarText,
                   opacity: 0.12
                }}
              />
            )}

            <div className="h-4"></div>

            <div className="p-4 space-y-6">
               {SETTINGS_MENUS.map(menu => (
                 <div key={menu.id} className="relative">
                    <button 
                      onClick={() => !isSettingsCollapsed && toggleMenu(menu.id)}
                      onMouseEnter={(e) => handleSettingsMenuHover(e, menu.id)}
                      onMouseLeave={handleSettingsMenuLeave}
                      className={`w-full flex items-center mb-2 p-2 rounded hover:bg-white/5 transition-colors ${isSettingsCollapsed ? 'justify-center' : 'justify-between'}`}
                    >
                       <div className={`flex items-center gap-2 font-semibold ${isSettingsCollapsed ? 'justify-center' : ''}`} style={{ color: currentTheme.colors.sidebarText }}>
                          <menu.icon size={18} />
                          {!isSettingsCollapsed && <span>{menu.label}</span>}
                       </div>
                       {!isSettingsCollapsed && (openMenus[menu.id] ? <ChevronUp size={14} style={{ color: currentTheme.colors.sidebarText, opacity: 0.7 }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.sidebarText, opacity: 0.7 }} />)}
                    </button>

                    {/* Expanded Mode: Accordion Content */}
                    {!isSettingsCollapsed && openMenus[menu.id] && (
                      <div className="ml-4 pl-4 border-l border-solid space-y-1" style={{ borderColor: `${currentTheme.colors.sidebarText}33` }}>
                         {menu.items.map(subItem => (
                           <button 
                              key={subItem.path}
                              onClick={() => handleSettingsNavigate(subItem.path)} 
                              className="block w-full text-left py-2 px-3 rounded text-sm transition-colors hover:bg-white/5" 
                              style={getSidebarItemStyle(location.pathname === subItem.path)}
                           >
                              <div className="flex items-center gap-2">
                                <subItem.icon size={14} />
                                {subItem.label}
                              </div>
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </aside>

          {/* 3. MAIN CONTENT AREA */}
          <main className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
            
            {/* TOGGLE STRIP */}
            {showToggleStrip && (
              <div 
                className="absolute top-0 bottom-0 left-0 z-40 flex items-center justify-start cursor-pointer group"
                style={{ width: '12px', marginLeft: '-1px' }}
                onClick={toggleSettingsCollapse}
                title={isSettingsCollapsed ? "Expandir Menu" : "Reduzir Menu"}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 w-[1px] group-hover:w-[2px] transition-all duration-200"
                  style={{ backgroundColor: currentTheme.colors.border }}
                />
                <div 
                  className="relative w-5 h-10 flex items-center justify-center rounded-r-md shadow-sm transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ 
                    backgroundColor: currentTheme.colors.sidebar,
                    boxShadow: `0 0 0 1px ${currentTheme.colors.sidebarText}1F`, // Updated to match sidebar border color style
                    color: currentTheme.colors.sidebarText
                  }}
                >
                    {isSettingsCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </div>
              </div>
            )}

            {showContent ? (
              <div className={`flex-1 overflow-y-auto w-full ${location.pathname.startsWith('/admin/obra/') ? "" : "p-8"} ${showToggleStrip ? 'pl-6' : ''}`}>
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

      {/* Floating Tooltips for Primary Sidebar */}
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

      {/* Floating Menu for Secondary Sidebar (Collapsed) */}
      {isSettingsCollapsed && hoveredSettingsMenu && hoveredMenuPosition && (
        <div 
          className="fixed z-[100] rounded-lg shadow-xl overflow-hidden border animate-in fade-in slide-in-from-left-2 duration-150"
          style={{ 
            top: hoveredMenuPosition.top,
            left: hoveredMenuPosition.left + 5, // Offset slightly
            minWidth: '200px',
            backgroundColor: currentTheme.colors.sidebar, // Match sidebar theme
            borderColor: `${currentTheme.colors.sidebarText}33`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={() => {
             // Keep it open when moving from icon to menu (clear timeout)
             if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
             }
             setHoveredSettingsMenu(hoveredSettingsMenu);
          }}
          onMouseLeave={handleSettingsMenuLeave}
        >
           {/* Header */}
           <div 
             className="px-4 py-3 font-semibold border-b flex items-center gap-2" 
             style={{ 
                color: currentTheme.colors.sidebarText,
                borderColor: `${currentTheme.colors.sidebarText}1F`
             }}
           >
              {SETTINGS_MENUS.find(m => m.id === hoveredSettingsMenu)?.label}
           </div>
           
           {/* Items */}
           <div className="py-2">
              {SETTINGS_MENUS.find(m => m.id === hoveredSettingsMenu)?.items.map(subItem => (
                 <button
                    key={subItem.path}
                    onClick={() => {
                        handleSettingsNavigate(subItem.path);
                        handleSettingsMenuLeave();
                    }}
                    className="w-full text-left px-4 py-2 flex items-center gap-3 transition-colors hover:bg-white/10"
                    style={{ 
                       color: location.pathname === subItem.path ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                       fontWeight: location.pathname === subItem.path ? 600 : 400
                    }}
                 >
                    <subItem.icon size={16} />
                    <span className="text-sm">{subItem.label}</span>
                 </button>
              ))}
           </div>
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
