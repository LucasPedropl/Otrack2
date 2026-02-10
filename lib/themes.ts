import { Theme } from '../types';

export const themes: Theme[] = [
  {
    id: 'light-minimal',
    name: 'Claro (Minimalista)',
    isDark: false,
    colors: {
      background: '#f8fafc', // Slate 50
      sidebar: '#ffffff',     // Sidebar Branca
      sidebarText: '#334155', // Slate 700
      card: '#ffffff',        // Cards Brancos
      text: '#0f172a',        // Slate 900
      textSecondary: '#64748b', // Slate 500
      primary: '#0f172a',     // Slate 900
      border: '#cbd5e1',      // Slate 300
    }
  },
  {
    id: 'midnight-mixed',
    name: 'Midnight (Misto)',
    isDark: false,
    colors: {
      background: '#ffffff',  // Fundo Branco Puro
      sidebar: '#09090b',     // Preto "Zinc" (Muito escuro)
      sidebarText: '#ffffff', // Texto Branco na barra
      card: '#ffffff',        // Cards Brancos
      text: '#09090b',        // Texto Preto na página branca
      textSecondary: '#71717a', // Cinza médio
      primary: '#18181b',     // Botões Pretos
      border: '#e4e4e7',      // Bordas cinza claro
    }
  },
  {
    id: 'corporate-navy',
    name: 'Corporativo (Navy)',
    isDark: false,
    colors: {
      background: '#f1f5f9', // Slate 100
      sidebar: '#0f172a',    // Slate 900
      sidebarText: '#ffffff', // Branco Puro
      card: '#ffffff',
      text: '#0f172a',
      textSecondary: '#475569',
      primary: '#0ea5e9',    // Sky 500
      border: '#cbd5e1',     // Slate 300
    }
  },
  {
    id: 'enterprise-forest',
    name: 'Enterprise (Verde)',
    isDark: false,
    colors: {
      background: '#f0fdf4', // Green 50
      sidebar: '#064e3b',    // Emerald 900
      sidebarText: '#ffffff', // Branco Puro
      card: '#ffffff',
      text: '#022c22',
      textSecondary: '#047857',
      primary: '#10b981',    // Emerald 500
      border: '#d1d5db',     // Gray 300
    }
  },
  {
    id: 'modern-charcoal',
    name: 'Moderno (Grafite)',
    isDark: false,
    colors: {
      background: '#f4f4f5', // Zinc 100
      sidebar: '#18181b',    // Zinc 950
      sidebarText: '#ffffff', // Branco Puro
      card: '#ffffff',
      text: '#18181b',
      textSecondary: '#52525b',
      primary: '#6366f1',    // Indigo 500
      border: '#d4d4d8',     // Zinc 300
    }
  },
  {
    id: 'saas-royal',
    name: 'SaaS (Roxo)',
    isDark: false,
    colors: {
      background: '#faf5ff', // Purple 50
      sidebar: '#4c1d95',    // Violet 900
      sidebarText: '#ffffff', // Branco Puro
      card: '#ffffff',
      text: '#2e1065',
      textSecondary: '#6d28d9',
      primary: '#8b5cf6',    // Violet 500
      border: '#d8b4fe',     // Purple 300
    }
  },
  {
    id: 'construction-orange',
    name: 'Obra (Laranja)',
    isDark: false,
    colors: {
      background: '#fff7ed', // Orange 50
      sidebar: '#9a3412',    // Orange 800
      sidebarText: '#ffffff', // Branco Puro
      card: '#ffffff',
      text: '#431407',
      textSecondary: '#c2410c',
      primary: '#f97316',    // Orange 500
      border: '#fdba74',     // Orange 300
    }
  },
  {
    id: 'cosmic',
    name: 'Cosmic (Escuro)',
    isDark: true,
    colors: {
      background: '#0f172a', // Slate 900
      sidebar: '#1e293b', // Slate 800
      sidebarText: '#f8fafc', // Slate 50
      card: '#1e293b',
      text: '#f8fafc', // Slate 50
      textSecondary: '#94a3b8', // Slate 400
      primary: '#6366f1', // Indigo 500
      border: '#334155', // Slate 700
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    colors: {
      background: '#282a36',
      sidebar: '#1e1f29',
      sidebarText: '#f8f8f2',
      card: '#44475a',
      text: '#f8f8f2',
      textSecondary: '#bd93f9',
      primary: '#bd93f9', // Purple
      border: '#6272a4',
    }
  },
  {
    id: 'supabase',
    name: 'Supabase',
    isDark: true,
    colors: {
      background: '#1c1c1c',
      sidebar: '#161616',
      sidebarText: '#ededed',
      card: '#232323',
      text: '#ededed',
      textSecondary: '#888888',
      primary: '#3ecf8e', // Green
      border: '#2e2e2e',
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    isDark: true,
    colors: {
      background: '#120d21', // Dark violet
      sidebar: '#1a1233',
      sidebarText: '#00f0ff',
      card: '#231842',
      text: '#ffe700', // Yellow
      textSecondary: '#ff003c', // Pink
      primary: '#00f0ff', // Cyan
      border: '#ff003c',
    }
  },
  {
    id: 'matrix',
    name: 'Matrix',
    isDark: true,
    colors: {
      background: '#000000',
      sidebar: '#0a0a0a',
      sidebarText: '#00ff41',
      card: '#0d0d0d',
      text: '#008f11',
      textSecondary: '#003b00',
      primary: '#00ff41',
      border: '#003b00',
    }
  },
  {
    id: 'forest',
    name: 'Forest (Escuro)',
    isDark: true,
    colors: {
      background: '#0f2218', // Dark Green
      sidebar: '#0a1710',
      sidebarText: '#d1e7dd',
      card: '#163324',
      text: '#e9f5f0',
      textSecondary: '#4d8a6a',
      primary: '#10b981', // Emerald
      border: '#1f4632',
    }
  },
  {
    id: 'ocean',
    name: 'Ocean (Escuro)',
    isDark: true,
    colors: {
      background: '#0f293a', // Deep Blue
      sidebar: '#081822',
      sidebarText: '#bae6fd',
      card: '#163a52',
      text: '#f0f9ff',
      textSecondary: '#38bdf8',
      primary: '#0ea5e9', // Sky
      border: '#1e4e6e',
    }
  },
  {
    id: 'sunset',
    name: 'Sunset (Laranja)',
    isDark: true,
    colors: {
      background: '#44403c', // Stone 700
      sidebar: '#292524',    // Stone 800
      sidebarText: '#fafafa', // Stone 50
      card: '#57534e',       // Stone 600
      text: '#fafafa',
      textSecondary: '#d6d3d1', // Stone 300
      primary: '#f97316',    // Orange 500
      border: '#57534e',     
    }
  },
  {
    id: 'jungle',
    name: 'Jungle (Verde)',
    isDark: true,
    colors: {
      background: '#44403c', // Stone 700
      sidebar: '#292524',    // Stone 800
      sidebarText: '#fafafa',
      card: '#57534e',       // Stone 600
      text: '#fafafa',
      textSecondary: '#d6d3d1', // Stone 300
      primary: '#84cc16',    // Lime 500
      border: '#57534e',     
    }
  },
  {
    id: 'midnight',
    name: 'Midnight (Preto)',
    isDark: true,
    colors: {
      background: '#000000',
      sidebar: '#0a0a0a',
      sidebarText: '#a3a3a3',
      card: '#171717',
      text: '#ffffff',
      textSecondary: '#737373',
      primary: '#ffffff',
      border: '#262626',
    }
  },
  {
    id: 'high-contrast-black',
    name: 'Alto Contraste (Preto)',
    isDark: true,
    colors: {
      background: '#000000',
      sidebar: '#000000',
      sidebarText: '#ffffff',
      card: '#000000',
      text: '#ffffff',
      textSecondary: '#ffffff',
      primary: '#ffffff',
      border: '#ffffff',
    }
  },
  {
    id: 'high-contrast-white',
    name: 'Alto Contraste (Branco)',
    isDark: false,
    colors: {
      background: '#ffffff',
      sidebar: '#ffffff',
      sidebarText: '#000000',
      card: '#ffffff',
      text: '#000000',
      textSecondary: '#000000',
      primary: '#000000',
      border: '#000000',
    }
  },
  {
    id: 'clean-blue',
    name: 'Clean (Azul)',
    isDark: false,
    colors: {
      background: '#f0f9ff',
      sidebar: '#ffffff',
      sidebarText: '#334155',
      card: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      primary: '#3b82f6', // Blue
      border: '#cbd5e1',
    }
  },
  {
    id: 'blossom',
    name: 'Blossom (Rosa)',
    isDark: false,
    colors: {
      background: '#fff1f2',
      sidebar: '#ffffff',
      sidebarText: '#881337',
      card: '#ffffff',
      text: '#881337',
      textSecondary: '#fb7185',
      primary: '#f43f5e', // Rose
      border: '#fecdd3',
    }
  },
  {
    id: 'sky',
    name: 'Sky (Céu)',
    isDark: false,
    colors: {
      background: '#f0f9ff',
      sidebar: '#e0f2fe',
      sidebarText: '#0369a1',
      card: '#ffffff',
      text: '#0c4a6e',
      textSecondary: '#38bdf8',
      primary: '#0ea5e9', // Sky
      border: '#bae6fd',
    }
  },
];