
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutProps } from '../../types';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, Building2, Calculator, ShieldCheck, ChevronDown, ChevronUp, Users, FileText, Ruler, Tag, ArrowLeft, FolderDot, Palette } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import { SettingsProvider, useSettingsSidebar } from '../../contexts/SettingsContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useConstructionSites } from '../../contexts/ConstructionSiteContext';
import { TopBar } from './TopBar';

const SETTINGS_PATHS = [
  '/admin/insumos',
  '/admin/unidades',
  '/admin/categorias',
  '/admin/colaboradores',
  '/admin/perfis',
  '/admin/usuarios',
  '/admin/dados'
];

const RAW_SETTINGS_MENUS = [
  {
    id: 'orcamento',
    label: 'Orçamento',
    icon: Calculator,
    items: [
      { label: 'Insumos', path: '/admin/insumos', icon: FileText, permission: 'orcamento_insumos:view' },
      { label: 'Unid. de Medidas', path: '/admin/unidades', icon: Ruler, permission: 'orcamento_unidades:view' },
      { label: 'Categorias', path: '/admin/categorias', icon: Tag, permission: 'orcamento_categorias:view' },
    ]
  },
  {
    id: 'mao_obra',
    label: 'Mão de Obra',
    icon: HardHat,
    items: [
      { label: 'Colaboradores', path: '/admin/colaboradores', icon: Users, permission: 'mao_obra_colaboradores:view' }
    ]
  },
  {
    id: 'acesso',
    label: 'Acesso ao sistema',
    icon: ShieldCheck,
    items: [
      { label: 'Perfis de acesso', path: '/admin/perfis', icon: ShieldCheck, permission: 'acesso_perfis:view' },
      { label: 'Usuários', path: '/admin/usuarios', icon: Users, permission: 'acesso_usuarios:view' },
    ]
  }
];

const AdminLayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { hasPermission, allowedSites, allSites, isAdmin, isLoading: isPermissionsLoading } = usePermissions();
  const { sites: allSitesList, isLoading: isSitesLoading } = useConstructionSites();
  
  const { 
    isCollapsed: isPrimaryCollapsed, 
    toggleSidebar: togglePrimarySidebar,
    isMobileOpen,
    closeMobileSidebar
  } = useSidebar();

  const { 
    isSettingsOpen, 
    isSettingsCollapsed,
    toggleSettingsOpen, 
    toggleSettingsCollapse,
    openSettings,
    closeSettings
  } = useSettingsSidebar();
  
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; top: number, left: number } | null>(null);
  const [hoveredSettingsMenu, setHoveredSettingsMenu] = useState<string | null>(null);
  const [hoveredMenuPosition, setHoveredMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    orcamento: true,
    acesso: true,
    mao_obra: true
  });

  const settingsMenus = RAW_SETTINGS_MENUS.map(menu => ({
    ...menu,
    items: menu.items.filter(item => hasPermission(item.permission.split(':')[0], 'view'))
  })).filter(menu => menu.items.length > 0);

  const hasSettingsAccess = settingsMenus.length > 0;

  // Filtragem das obras baseada nas permissões
  const sidebarSites = useMemo(() => {
     return allSitesList.filter(site => {
        if (isAdmin || allSites) return true;
        return allowedSites.includes(site.id!);
     });
  }, [allSitesList, isAdmin, allSites, allowedSites]);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    const shouldAutoOpen = SETTINGS_PATHS.some(path => location.pathname.startsWith(path));
    
    if (shouldAutoOpen) {
      if (!isSettingsOpen) openSettings();
    } else {
      if (isSettingsOpen) closeSettings();
    }
  }, [location.pathname, isSettingsOpen, openSettings, closeSettings]);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname]);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleTooltip = (e: React.MouseEvent<HTMLElement>, label: string, sidebarType: 'primary') => {
    if (window.innerWidth < 768) return;
    if (sidebarType === 'primary' && !isPrimaryCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + (rect.height / 2),
      left: rect.right + 10
    });
  };

  const handleTooltipLeave = () => setHoveredTooltip(null);

  const handleSettingsHover = (e: React.MouseEvent<HTMLElement>, menuId: string) => {
    if (!isSettingsCollapsed || window.innerWidth < 768) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredMenuPosition({
      top: rect.top,
      left: rect.right + 10
    });
    setHoveredSettingsMenu(menuId);
  };

  const handleSettingsLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSettingsMenu(null);
    }, 300);
  };

  const handleSubMenuEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const navItemsRaw = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', permission: 'dashboard:view' },
    { icon: Building2, label: 'Gerenciar Obras', path: '/admin/obras', permission: 'obras:view' },
  ];

  const navItems = navItemsRaw.filter(item => hasPermission(item.permission.split(':')[0], 'view'));

  const handlePrimaryNavigate = (path: string) => {
    navigate(path);
  };

  const handleSettingsNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) closeSettings();
  };

  const isSettingsPath = SETTINGS_PATHS.includes(location.pathname);
  const showContent = !isSettingsOpen || (isSettingsOpen && isSettingsPath);
  const showToggleStrip = isSettingsOpen || isSettingsPath;

  const getSidebarItemStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 
        (currentTheme.isDark || ['#000000', '#09090b', '#18181b'].includes(currentTheme.colors.sidebar) ? 'rgba(255,255,255,0.12)' : `${currentTheme.colors.primary}15`) 
        : 'transparent',
    color: currentTheme.colors.sidebarText,
    opacity: isActive ? 1 : 0.7,
    fontWeight: isActive ? 600 : 400
  });

  if (isPermissionsLoading) return null;

  return (
    <div className="h-screen flex flex-row overflow-hidden transition-colors duration-300" style={{ backgroundColor: currentTheme.colors.background }}>
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={closeMobileSidebar} />}

      <aside className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} ${isPrimaryCollapsed ? 'md:w-20' : 'md:w-64'}`} style={{ backgroundColor: currentTheme.colors.sidebar, color: currentTheme.colors.sidebarText }}>
        <div className="absolute right-0 top-0 bottom-0 w-[1px] z-50" style={{ backgroundColor: currentTheme.colors.sidebarText, opacity: 0.12 }} />
        <button onClick={togglePrimarySidebar} className="absolute hidden md:flex items-center justify-center h-6 w-6 rounded-lg border border-solid shadow-sm z-50 transition-colors" style={{ top: '81px', right: '-12px', transform: 'translateY(-50%)', backgroundColor: currentTheme.colors.sidebar, borderColor: `${currentTheme.colors.sidebarText}1F`, color: currentTheme.colors.sidebarText }}>{isPrimaryCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
        <div className={`h-[81px] p-6 flex items-center transition-all ${isPrimaryCollapsed ? 'md:justify-center' : 'space-x-3'} relative`}><div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ backgroundColor: currentTheme.colors.sidebarText, opacity: 0.12 }} /><HardHat className="h-8 w-8 flex-shrink-0" style={{ color: currentTheme.colors.sidebarText }} /><div className={`overflow-hidden whitespace-nowrap ${(isPrimaryCollapsed && !isMobileOpen) ? 'md:hidden' : 'block'}`}><h1 className="text-xl font-bold tracking-tight">ObraLog</h1><p className="text-xs opacity-70">Gestão de Obra</p></div></div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (<button key={item.path} onClick={() => handlePrimaryNavigate(item.path)} onMouseEnter={(e) => handleTooltip(e, item.label, 'primary')} onMouseLeave={handleTooltipLeave} className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'md:justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`} style={getSidebarItemStyle(isActive)}><item.icon className="h-5 w-5 flex-shrink-0" /><span className={`whitespace-nowrap ${(isPrimaryCollapsed && !isMobileOpen) ? 'md:hidden' : 'block'}`}>{item.label}</span></button>);
          })}
          {(hasPermission('obras', 'view') || isAdmin) && (
            <div className="pt-4 mt-2">
              <p className={`px-4 text-xs font-bold uppercase tracking-wider mb-2 opacity-50 ${(isPrimaryCollapsed && !isMobileOpen) ? 'md:hidden' : 'block'}`}>Obras Ativas</p>
              <div className="space-y-1">
                {sidebarSites.map((site) => (<button key={site.id} onClick={() => handlePrimaryNavigate(`/admin/obra/${site.id}`)} onMouseEnter={(e) => handleTooltip(e, site.name, 'primary')} onMouseLeave={handleTooltipLeave} className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'md:justify-center' : 'space-x-3'} px-4 py-2 rounded-lg transition-all hover:bg-white/5`} style={getSidebarItemStyle(location.pathname.startsWith(`/admin/obra/${site.id}`))}><FolderDot className="h-4 w-4 flex-shrink-0" /><span className={`whitespace-nowrap text-sm truncate ${(isPrimaryCollapsed && !isMobileOpen) ? 'md:hidden' : 'block'}`}>{site.name}</span></button>))}
              </div>
            </div>
          )}
        </nav>
        
        {/* SÓ MOSTRA APARÊNCIA SE TIVER ALGUM ACESSO A CONFIGS OU FOR ADMIN */}
        {(hasSettingsAccess || isAdmin) && (
          <div className="p-4 relative"><div className="absolute top-0 left-0 right-0 h-[1px]" style={{ backgroundColor: currentTheme.colors.sidebarText, opacity: 0.12 }} /><button onClick={() => handlePrimaryNavigate('/admin/settings')} onMouseEnter={(e) => handleTooltip(e, 'Configurações', 'primary')} onMouseLeave={handleTooltipLeave} className={`group relative w-full flex items-center ${isPrimaryCollapsed ? 'md:justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`} style={getSidebarItemStyle(location.pathname === '/admin/settings')}><Settings className="h-5 w-5 flex-shrink-0" /><span className={`whitespace-nowrap ${(isPrimaryCollapsed && !isMobileOpen) ? 'md:hidden' : 'block'}`}>Configurações</span></button></div>
        )}
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <TopBar onToggleSettings={toggleSettingsOpen} isSettingsOpen={isSettingsOpen} hasSettingsAccess={hasSettingsAccess} />
        <div className="flex-1 flex overflow-hidden relative">
          <aside className={`flex-shrink-0 transition-all duration-300 flex flex-col z-20 relative ${isSettingsOpen ? (isSettingsCollapsed ? 'md:w-20 overflow-visible' : 'w-full md:w-64 overflow-y-auto') : 'w-0 overflow-hidden'} ${isSettingsOpen ? 'absolute inset-0 md:relative' : ''}`} style={{ backgroundColor: currentTheme.colors.sidebar, color: currentTheme.colors.sidebarText, height: '100%', opacity: isSettingsOpen ? 1 : 0, transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-100%)', visibility: isSettingsOpen ? 'visible' : 'hidden' }}>
            <div className="p-4 space-y-6">
              {settingsMenus.map(menu => (
                <div 
                  key={menu.id} 
                  className="relative"
                  onMouseEnter={(e) => handleSettingsHover(e, menu.id)}
                  onMouseLeave={handleSettingsLeave}
                >
                  <button onClick={() => !isSettingsCollapsed && toggleMenu(menu.id)} className={`w-full flex items-center mb-2 p-2 rounded hover:bg-white/5 transition-colors ${isSettingsCollapsed ? 'justify-center' : 'justify-between'}`}><div className={`flex items-center gap-2 font-semibold ${isSettingsCollapsed ? 'justify-center' : ''}`} style={{ color: currentTheme.colors.sidebarText }}><menu.icon size={18} />{!isSettingsCollapsed && <span>{menu.label}</span>}</div>{!isSettingsCollapsed && (openMenus[menu.id] ? <ChevronUp size={14} style={{ color: currentTheme.colors.sidebarText, opacity: 0.7 }} /> : <ChevronDown size={14} style={{ color: currentTheme.colors.sidebarText, opacity: 0.7 }} />)}</button>
                  {(!isSettingsCollapsed || window.innerWidth < 768) && openMenus[menu.id] && (<div className="ml-4 pl-4 border-l border-solid space-y-1" style={{ borderColor: `${currentTheme.colors.sidebarText}33` }}>{menu.items.map(subItem => (<button key={subItem.path} onClick={() => handleSettingsNavigate(subItem.path)} className="block w-full text-left py-2 px-3 rounded text-sm transition-all hover:bg-black/5 dark:hover:bg-white/10 hover:!opacity-100" style={getSidebarItemStyle(location.pathname === subItem.path)}><div className="flex items-center gap-2"><subItem.icon size={14} />{subItem.label}</div></button>))}</div>)}
                </div>
              ))}
            </div>
          </aside>
          <main className={`flex-1 relative w-full h-full overflow-hidden flex flex-col ${isSettingsOpen ? 'hidden md:flex' : 'flex'}`}>{showToggleStrip && (<div className="absolute top-0 bottom-0 left-0 z-40 hidden md:flex items-center justify-start cursor-pointer group" style={{ width: '12px', marginLeft: '-1px' }} onClick={toggleSettingsCollapse}><div className="absolute top-0 bottom-0 left-0 w-[1px] group-hover:w-[2px] transition-all duration-200" style={{ backgroundColor: currentTheme.colors.border }} /><div className="relative w-5 h-10 flex items-center justify-center rounded-r-md shadow-sm transition-transform duration-200 group-hover:translate-x-0.5" style={{ backgroundColor: currentTheme.colors.sidebar, color: currentTheme.colors.sidebarText }}><ChevronLeft size={14} /></div></div>)}<div className={`flex-1 overflow-y-auto w-full ${location.pathname.startsWith('/admin/obra/') ? "" : "p-4 sm:p-8"} ${showToggleStrip ? 'md:pl-6' : ''}`}>{children}</div></main>
        </div>
      </div>

      {/* Tooltip for primary sidebar */}
      {hoveredTooltip && (
        <div 
          className="fixed z-[100] px-3 py-2 text-sm font-medium rounded-md shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            top: hoveredTooltip.top, 
            left: hoveredTooltip.left,
            transform: 'translateY(-50%)',
            backgroundColor: currentTheme.colors.card,
            color: currentTheme.colors.text,
            border: `1px solid ${currentTheme.colors.border}`
          }}
        >
          {hoveredTooltip.label}
        </div>
      )}

      {/* Settings Submenu Popover for Collapsed State */}
      {isSettingsCollapsed && hoveredSettingsMenu && hoveredMenuPosition && (
        <div 
          className="fixed z-[100] w-56 rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            top: hoveredMenuPosition.top, 
            left: hoveredMenuPosition.left,
            backgroundColor: currentTheme.colors.card,
            borderColor: currentTheme.colors.border
          }}
          onMouseEnter={handleSubMenuEnter}
          onMouseLeave={handleSettingsLeave}
        >
          <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}>
            {settingsMenus.find(m => m.id === hoveredSettingsMenu)?.label}
          </div>
          <div className="p-2 space-y-1">
            {settingsMenus.find(m => m.id === hoveredSettingsMenu)?.items.map(subItem => (
              <button 
                key={subItem.path} 
                onClick={() => handleSettingsNavigate(subItem.path)} 
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color: location.pathname === subItem.path ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
                  backgroundColor: location.pathname === subItem.path ? `${currentTheme.colors.primary}15` : 'transparent',
                  fontWeight: location.pathname === subItem.path ? 600 : 400
                }}
              >
                <subItem.icon size={16} />
                {subItem.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminLayout: React.FC<LayoutProps> = (props) => (
  <SidebarProvider><SettingsProvider><AdminLayoutContent {...props} /></SettingsProvider></SidebarProvider>
);
