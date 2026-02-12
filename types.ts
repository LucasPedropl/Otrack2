import React from 'react';

export interface User {
  id?: string;
  name?: string; // Nome do usuário
  email: string;
  role: 'admin' | 'almoxarife' | 'operario'; // Mantido para compatibilidade legado, mas o sistema usará AccessProfile
  profileId?: string; // Link para o AccessProfile customizado
  createdAt: Date;
}

export interface AccessProfile {
  id?: string;
  name: string;
  // Permissions format: "module:action" (e.g., "dashboard:view", "inventory:create")
  // Special action: "admin:full" grants everything
  permissions: string[];
  // IDs of specific construction sites this profile can access. 
  // If empty or undefined, assumes access to ALL sites (if permission module exists).
  allowedSites?: string[]; 
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

export interface SiteInventoryItem {
  id?: string;
  originalItemId: string; // ID do Insumo Global
  name: string; // Nome (denormalizado para facilitar listagem)
  unit: string; // Unidade (denormalizado)
  category: string; // Categoria (denormalizado)
  quantity: number; // Quantidade NA OBRA
  averagePrice?: number; // Preço médio (vindo do PDF)
  minThreshold: number; // Mínimo PARA ESTA OBRA
  siteId: string; // ID da Obra pai
  updatedAt: Date;
}

export interface StockMovement {
  id?: string;
  type: 'IN' | 'OUT'; // Entrada ou Saída
  quantity: number;
  date: Date;
  reason?: string; // Motivo / Observação
  userId?: string; // Quem fez a movimentação
  userName?: string;
  // Optional Denormalized fields for list views
  itemName?: string;
  itemUnit?: string;
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