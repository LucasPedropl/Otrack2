import React, { useEffect, useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { constructionService } from '../../../services/constructionService';
import { ConstructionSite } from '../../../types';
import { 
  LayoutDashboard, Package, ArrowLeftRight, 
  Loader2, Hammer, Truck, HardHat, Menu, X,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react';

const ObraRoot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('obralog_obra_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('obralog_obra_sidebar_collapsed', String(newState));
  };

  useEffect(() => {
    const fetchSite = async () => {
      if (!id) return;
      try {
        const data = await constructionService.getById(id);
        if (data) {
          setSite(data);
        } else {
          navigate('/admin/obras');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [id, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: currentTheme.colors.primary }} />
      </div>
    );
  }

  if (!site) return null;

  const navItems = [
    { path: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { path: 'inventory', label: 'Almoxarifado', icon: Package },
    { path: 'tools', label: 'Ferramentas', icon: Hammer },
    { path: 'epi', label: 'EPIs', icon: HardHat },
    { path: 'rented', label: 'Equip. Alugados', icon: Truck },
    { path: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
  ];

  const quickActions = [
    { label: 'Retirada EPI', icon: HardHat, action: () => navigate(`/admin/obra/${id}/epi`) },
    { label: 'Empréstimo', icon: Hammer, action: () => navigate(`/admin/obra/${id}/tools`) },
    { label: 'Novo Insumo', icon: Package, action: () => navigate(`/admin/obra/${id}/inventory`) },
    { label: 'Novo Equipamento', icon: Truck, action: () => navigate(`/admin/obra/${id}/rented`) },
  ];

  const getSidebarItemStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 
        (currentTheme.isDark || ['#000000', '#09090b', '#18181b'].includes(currentTheme.colors.sidebar) ? 'rgba(255,255,255,0.12)' : `${currentTheme.colors.primary}15`) 
        : 'transparent',
    color: currentTheme.colors.sidebarText,
    opacity: isActive ? 1 : 0.7,
    fontWeight: isActive ? 600 : 400
  });

  const currentPath = location.pathname.split('/').pop();
  const currentNavItem = navItems.find(item => item.path === currentPath);
  const pageTitle = currentNavItem ? `${site.name} - ${currentNavItem.label}` : site.name;

  return (
    <div className="flex flex-row h-full relative overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ backgroundColor: currentTheme.colors.background }}>
        {pageTitle && (
          <div className="px-4 md:px-8 pt-6 pb-2 shrink-0">
             <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>{pageTitle}</h1>
          </div>
        )}
        <div 
            className={`flex-1 overflow-y-auto px-4 md:px-8 ${pageTitle ? 'pt-4' : 'pt-8'} pb-8 no-scrollbar`}
        >
          <Outlet />
        </div>
      </div>

      {/* Desktop Right Sidebar (Collapsible) */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 border-l transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        style={{ 
          backgroundColor: currentTheme.colors.sidebar,
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.sidebarText
        }}
      >
         {/* Toggle Button */}
         <button 
            onClick={toggleSidebar}
            className="absolute flex items-center justify-center h-6 w-6 rounded-lg border border-solid shadow-sm z-50 transition-colors hover:bg-white/10"
            style={{ 
                left: 0,
                top: 24, // Align roughly with the top of the menu or page title
                transform: 'translate(-50%, 0)',
                backgroundColor: currentTheme.colors.sidebar, 
                borderColor: `${currentTheme.colors.sidebarText}1F`,
                color: currentTheme.colors.sidebarText
            }}
         >
            {isSidebarCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
         </button>

         <nav className="p-4 mt-8 space-y-1 overflow-y-auto overflow-x-hidden">
           {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={`/admin/obra/${id}/${item.path}`}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-sm transition-all hover:bg-white/5 group relative`}
                style={({ isActive }) => getSidebarItemStyle(isActive)}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
           ))}
         </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center p-2 pb-safe z-40"
        style={{ 
            backgroundColor: currentTheme.colors.card,
            borderColor: currentTheme.colors.border
        }}
      >
          <NavLink 
            to={`/admin/obra/${id}/overview`}
            className={({ isActive }) => `p-3 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-50'}`}
            style={({ isActive }) => ({ color: isActive ? currentTheme.colors.primary : currentTheme.colors.text })}
          >
             <LayoutDashboard size={24} />
             <span className="text-[10px]">Visão</span>
          </NavLink>
          
          <NavLink 
            to={`/admin/obra/${id}/inventory`}
            className={({ isActive }) => `p-3 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-50'}`}
            style={({ isActive }) => ({ color: isActive ? currentTheme.colors.primary : currentTheme.colors.text })}
          >
             <Package size={24} />
             <span className="text-[10px]">Estoque</span>
          </NavLink>

          <NavLink 
            to={`/admin/obra/${id}/tools`}
            className={({ isActive }) => `p-3 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-50'}`}
            style={({ isActive }) => ({ color: isActive ? currentTheme.colors.primary : currentTheme.colors.text })}
          >
             <Hammer size={24} />
             <span className="text-[10px]">Ferr.</span>
          </NavLink>

          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 rounded-xl flex flex-col items-center gap-1 opacity-50 hover:opacity-100"
            style={{ color: currentTheme.colors.text }}
          >
             <Menu size={24} />
             <span className="text-[10px]">Menu</span>
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            
            {/* Content */}
            <div 
                className="absolute inset-0 flex flex-col p-6 z-10"
                style={{ backgroundColor: currentTheme.colors.background }}
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>Menu</h2>
                        <p className="text-sm opacity-60" style={{ color: currentTheme.colors.textSecondary }}>{site.name}</p>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-black/5"
                        style={{ color: currentTheme.colors.text }}
                    >
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pb-20">
                    {/* Quick Actions Grid */}
                    <section>
                        <h3 className="text-sm font-bold opacity-50 mb-4 uppercase" style={{ color: currentTheme.colors.textSecondary }}>Ações Rápidas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {quickActions.map((qa, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => { qa.action(); setIsMobileMenuOpen(false); }}
                                    className="p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors active:scale-95"
                                    style={{ 
                                        backgroundColor: currentTheme.colors.card,
                                        borderColor: currentTheme.colors.border,
                                        color: currentTheme.colors.text
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-opacity-10" style={{ backgroundColor: currentTheme.colors.primary + '20', color: currentTheme.colors.primary }}>
                                        <qa.icon size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-center">{qa.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* All Navigation Links */}
                    <section>
                        <h3 className="text-sm font-bold opacity-50 mb-4 uppercase" style={{ color: currentTheme.colors.textSecondary }}>Navegação</h3>
                        <div className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={`/admin/obra/${id}/${item.path}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-4 p-4 rounded-xl border transition-all
                                        ${isActive ? 'border-opacity-100' : 'border-opacity-50'}
                                    `}
                                    style={({ isActive }) => ({
                                        backgroundColor: currentTheme.colors.card,
                                        borderColor: isActive ? currentTheme.colors.primary : currentTheme.colors.border,
                                        color: isActive ? currentTheme.colors.primary : currentTheme.colors.text
                                    })}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ObraRoot;
