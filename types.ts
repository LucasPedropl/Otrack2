import React from 'react';

export interface User {
  id?: string;
  email: string;
  role: 'admin' | 'almoxarife' | 'operario';
  createdAt: Date;
}

export interface InventoryItem {
  id?: string;
  code?: string; // Código
  name: string; // Nome
  quantity: number; // Quantidade atual (pode ser inicializada com 0)
  unit: string; // Und. orçamento (usando string livre por enquanto conforme pedido de input)
  category: string; // Categoria
  costType?: string; // Tipo custo
  unitValue?: number; // Vlr. unitário
  stockControl: boolean; // Controle de estoque (Sim/Não)
  minThreshold: number; // Qtd. mínima estoque
  updatedAt: Date;
}

export interface ConstructionSite {
  id?: string;
  name: string;
  createdAt: Date;
}

// Novos tipos para Configurações
export interface MeasurementUnit {
  id?: string;
  name: string; // Nome (ex: Balde)
  abbreviation: string; // Abreviação (ex: Bd)
}

export interface ItemCategory {
  id?: string;
  type: 'Produto' | 'Serviço'; // Tipo
  category: string; // Categoria
  subcategory: string; // Subcategoria
  registrationType: 'Próprio' | 'Padrão'; // Cadastro
}

export interface ThemeColors {
  background: string;
  sidebar: string;
  sidebarText: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Layout specific props as requested
export interface LayoutProps {
  children: React.ReactNode;
  // While we have a ThemeContext, we keep this optional to allow overrides or legacy usage
  bgColor?: string; 
  pageTitle?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}