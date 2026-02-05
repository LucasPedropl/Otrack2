import React, { useState } from 'react';
import { LayoutProps } from '../../types';
import { LayoutDashboard, HardHat, Settings, ChevronLeft, ChevronRight, Building2, Calculator, ShieldCheck, ChevronDown, ChevronUp, Users, FileText, Ruler, Tag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { TopBar } from './TopBar';

export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  
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

  // Main Navigation (Primary Sidebar)
  // Removed 'Insumos' from here as requested
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Obras', path: '/admin/obras' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    // On mobile we might want to close sidebar, but for desktop we keep it open
  };

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 overflow-hidden"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* 1. PRIMARY SIDEBAR */}
      <aside 
        className={`flex-shrink-0 transition-all duration-300 border-b md:border-b-0 md:border-r flex flex-col relative z-20 ${isCollapsed ? 'w-20' : 'w-full md:w-64'}`}
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
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
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
        </nav>

        {/* Original Settings Link (Now goes to general settings page) */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <button
            onClick={() => handleNavigate('/admin/settings')}
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

      {/* 2. SECONDARY SIDEBAR (SETTINGS PANEL) */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 border-r overflow-y-auto flex flex-col z-10 ${isSettingsOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}
        style={{ 
            backgroundColor: currentTheme.colors.background === '#f8fafc' ? '#ffffff' : currentTheme.colors.sidebar, // Slightly different shade if light mode
            borderColor: currentTheme.colors.border 
        }}
      >
        <div className="h-[81px] flex items-center px-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
           <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2" style={{ color: currentTheme.colors.primary }}>
             <Settings size={16} />
             Configurações
           </h2>
        </div>

        <div className="p-4 space-y-6">
           
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
                   <button onClick={() => handleNavigate('/admin/insumos')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/insumos' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/insumos' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} />
                        Insumos
                      </div>
                   </button>
                   <button onClick={() => handleNavigate('/admin/unidades')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/unidades' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/unidades' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                      <div className="flex items-center gap-2">
                        <Ruler size={14} />
                        Unid. de Medidas
                      </div>
                   </button>
                   <button onClick={() => handleNavigate('/admin/categorias')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/categorias' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/categorias' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
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
                   <button onClick={() => handleNavigate('/admin/perfis')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/perfis' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/perfis' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} />
                        Perfis de acesso
                      </div>
                   </button>
                   <button onClick={() => handleNavigate('/admin/usuarios')} className={`block w-full text-left py-2 px-3 rounded text-sm transition-colors ${location.pathname === '/admin/usuarios' ? 'bg-black/5 dark:bg-white/10 font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ color: location.pathname === '/admin/usuarios' ? currentTheme.colors.primary : currentTheme.colors.textSecondary }}>
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

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto h-screen flex flex-col relative w-full">
        {/* Pass toggle function to TopBar */}
        <TopBar onToggleSettings={toggleSettings} isSettingsOpen={isSettingsOpen} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};