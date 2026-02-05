import React, { useState, useEffect } from 'react';
import { LayoutProps } from '../../types';
import { LayoutDashboard, Package, HardHat, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { TopBar } from './TopBar';

export const AdminLayout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('obralog_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('obralog_sidebar_collapsed', String(newState));
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Insumos', path: '/admin/insumos' },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row transition-colors duration-300"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* Sidebar */}
      <aside 
        className={`flex-shrink-0 transition-all duration-300 border-b md:border-b-0 md:border-r flex flex-col relative ${isCollapsed ? 'w-20' : 'w-full md:w-64'}`}
        style={{ 
          backgroundColor: currentTheme.colors.sidebar, 
          color: currentTheme.colors.sidebarText,
          borderColor: currentTheme.colors.border
        }}
      >
        {/* Toggle Button - Positioned at intersection of header/nav */}
        <button
          onClick={toggleSidebar}
          className="absolute hidden md:flex items-center justify-center h-6 w-6 rounded-lg border shadow-sm z-50 transition-colors"
          style={{ 
            top: '81px', // Exact height of the header border line
            right: '-12px', // Half outside
            transform: 'translateY(-50%)',
            backgroundColor: currentTheme.colors.card, 
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

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

        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
                style={{
                  backgroundColor: 'transparent',
                  color: isActive ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
                }}
              >
                {/* Content wrapper to handle opacity without affecting tooltip */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                     style={{ opacity: isActive ? 1 : 0.6 }}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </div>
                
                {/* Tooltip for Collapsed State */}
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

        {/* Settings moved to bottom */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <button
            onClick={() => navigate('/admin/settings')}
            className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all hover:bg-white/5`}
            style={{
              backgroundColor: 'transparent',
              color: location.pathname === '/admin/settings' ? currentTheme.colors.primary : currentTheme.colors.sidebarText,
            }}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`} 
                 style={{ opacity: location.pathname === '/admin/settings' ? 1 : 0.6 }}>
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">Configurações</span>}
            </div>

            {/* Tooltip for Collapsed State */}
            {isCollapsed && (
              <div 
                className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md border"
                style={{ 
                  backgroundColor: currentTheme.colors.card,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }}
              >
                Configurações
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        <TopBar pageTitle={pageTitle} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};