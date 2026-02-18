
import React, { useEffect, useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { constructionService } from '../../../services/constructionService';
import { ConstructionSite } from '../../../types';
import { Building2, Settings, LayoutDashboard, Package, ArrowLeftRight, Loader2, Calendar, MapPin, Hammer, Truck } from 'lucide-react';

const ObraRoot: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [site, setSite] = useState<ConstructionSite | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: currentTheme.colors.primary }} />
      </div>
    );
  }

  if (!site) return null;

  const tabs = [
    { path: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { path: 'inventory', label: 'Almoxarifado', icon: Package },
    { path: 'tools', label: 'Ferramentas', icon: Hammer },
    { path: 'rented', label: 'Equip. Alugados', icon: Truck },
    { path: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header Container */}
      <div 
        className="flex-shrink-0 border-b shadow-sm z-10"
        style={{ 
          backgroundColor: currentTheme.colors.background === '#f8fafc' ? '#ffffff' : currentTheme.colors.card, // Ligeiro contraste se for tema light
          borderColor: currentTheme.colors.border
        }}
      >
        {/* Main Title Row */}
        <div className="px-6 py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
               {/* Icon Box */}
               <div 
                  className="p-3 rounded-xl shadow-sm border"
                  style={{ 
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border
                  }}
               >
                  <Building2 className="h-8 w-8" style={{ color: currentTheme.colors.primary }} />
               </div>

               {/* Text Info */}
               <div>
                  <h1 className="text-2xl font-bold leading-tight mb-1" style={{ color: currentTheme.colors.text }}>
                    {site.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm opacity-70" style={{ color: currentTheme.colors.textSecondary }}>
                     <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>Iniciada em {site.createdAt ? new Date(site.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                     </div>
                     <span className="hidden sm:inline">•</span>
                     <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        <span>Localização Principal</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start md:self-center">
               <button 
                  onClick={() => navigate(`/admin/obra/${id}/settings`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ 
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text
                  }}
               >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Configurar</span>
               </button>
            </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-6 mt-2 flex items-center gap-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={`/admin/obra/${id}/${tab.path}`}
                className={({ isActive }) => `
                  relative flex items-center gap-2 pb-4 text-sm font-medium transition-all whitespace-nowrap
                  ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
                `}
                style={({ isActive }) => ({
                  color: isActive ? currentTheme.colors.primary : currentTheme.colors.text,
                })}
              >
                {({ isActive }) => (
                  <>
                    <tab.icon size={18} />
                    {tab.label}
                    {/* Active Bottom Border Line */}
                    {isActive && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full transition-all"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: currentTheme.colors.background }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ObraRoot;
