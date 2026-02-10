import React, { useEffect, useState } from 'react';
import { inventoryService } from '../../../services/inventoryService';
import { InventoryItem } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Package, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const StatCard: React.FC<{
  title: string; 
  value: string; 
  icon: React.ElementType; 
  trend?: string;
  colorClass: string; // Tailwind class for icon bg
  theme: any;
}> = ({ title, value, icon: Icon, trend, colorClass, theme }) => (
  <div 
    className="p-6 rounded-xl shadow-sm border"
    style={{ 
      backgroundColor: theme.colors.card, 
      borderColor: theme.colors.border 
    }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>{title}</p>
        <h3 className="text-2xl font-bold mt-2" style={{ color: theme.colors.text }}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    {trend && <p className="text-sm text-green-500 mt-4 flex items-center">
      <TrendingUp className="h-3 w-3 mr-1" /> {trend}
    </p>}
  </div>
);

const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await inventoryService.getAll();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch inventory", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const lowStockItems = items.filter(i => i.quantity <= i.minThreshold);
  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const distinctItems = items.length;

  // Only use placeholder data if NOT loading and items list is truly empty
  const chartData = items.length > 0 ? items.slice(0, 5).map(i => ({
    name: i.name,
    quantidade: i.quantity
  })) : [
    { name: 'Cimento', quantidade: 40 },
    { name: 'Areia', quantidade: 30 },
    { name: 'Tijolo', quantidade: 20 },
    { name: 'Brita', quantidade: 27 },
    { name: 'Aço', quantidade: 18 },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Itens Cadastrados" 
          value={isLoading ? "-" : distinctItems.toString()} 
          icon={Package} 
          trend={isLoading ? undefined : "+4 novos hoje"}
          colorClass="bg-blue-500"
          theme={currentTheme}
        />
        <StatCard 
          title="Estoque Total" 
          value={isLoading ? "-" : totalItems.toString()} 
          icon={TrendingUp} 
          colorClass="bg-emerald-500"
          theme={currentTheme}
        />
        <StatCard 
          title="Alertas de Baixo Estoque" 
          value={isLoading ? "-" : lowStockItems.length.toString()} 
          icon={AlertTriangle} 
          colorClass="bg-orange-500"
          theme={currentTheme}
        />
        <StatCard 
          title="Valor Estimado" 
          value="R$ 142.5k" 
          icon={DollarSign} 
          colorClass="bg-indigo-500"
          theme={currentTheme}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div 
          className="lg:col-span-2 p-6 rounded-xl shadow-sm border"
          style={{ 
            backgroundColor: currentTheme.colors.card, 
            borderColor: currentTheme.colors.border 
          }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: currentTheme.colors.text }}>Movimentação de Materiais</h3>
          <div className="h-80 w-full" style={{ minWidth: 0 }}>
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" style={{ color: currentTheme.colors.primary }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={currentTheme.colors.border} />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: currentTheme.colors.textSecondary}} stroke={currentTheme.colors.border} />
                  <YAxis tick={{fill: currentTheme.colors.textSecondary}} stroke={currentTheme.colors.border} />
                  <Tooltip 
                    cursor={{fill: currentTheme.colors.border, opacity: 0.3}}
                    contentStyle={{ 
                      backgroundColor: currentTheme.colors.card,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: currentTheme.colors.text }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    fill={currentTheme.colors.primary} 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div 
          className="p-6 rounded-xl shadow-sm border"
          style={{ 
            backgroundColor: currentTheme.colors.card, 
            borderColor: currentTheme.colors.border 
          }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: currentTheme.colors.text }}>Alertas Recentes</h3>
          <div className="space-y-4">
            {isLoading ? (
               <div className="flex justify-center py-4">
                 <Loader2 className="animate-spin h-5 w-5" style={{ color: currentTheme.colors.textSecondary }} />
               </div>
            ) : lowStockItems.length > 0 ? (
              lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center p-3 rounded-lg border bg-red-500/10 border-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>{item.name}</p>
                    <p className="text-xs text-red-500">Abaixo do mínimo: {item.quantity} {item.unit}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8" style={{ color: currentTheme.colors.textSecondary }}>
                <p>Nenhum alerta crítico.</p>
              </div>
            )}
            
            <div 
              className="flex items-center p-3 rounded-lg border"
              style={{ 
                backgroundColor: `${currentTheme.colors.primary}10`, // 10% opacity
                borderColor: `${currentTheme.colors.primary}30` 
              }}
            >
              <Package className="h-5 w-5 mr-3" style={{ color: currentTheme.colors.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>Entrega Recebida</p>
                <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>Cimento CP-II (200 sc) recebido há 2h</p>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full mt-6 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              color: currentTheme.colors.primary, 
              backgroundColor: 'transparent',
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            Ver Todos os Alertas
          </button>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;