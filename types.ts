
import React from 'react';

export interface User {
  id?: string;
  name?: string;
  email: string;
  password?: string;
  role: 'admin' | 'almoxarife' | 'operario';
  profileId?: string;
  createdAt: Date;
}

export interface AccessProfile {
  id?: string;
  name: string;
  permissions: string[];
  allSites: boolean; // Flag explícita: true = todas, false = apenas as da lista
  allowedSites: string[]; 
}

export interface InventoryItem {
  id?: string;
  code?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  costType?: string;
  unitValue?: number;
  stockControl: boolean;
  minThreshold: number;
  updatedAt: Date;
}

export interface SiteInventoryItem {
  id?: string;
  originalItemId: string;
  name: string;
  unit: string;
  category: string;
  quantity: number;
  averagePrice?: number;
  minThreshold: number;
  siteId: string;
  updatedAt: Date;
}

export interface StockMovement {
  id?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: Date;
  reason?: string;
  userId?: string;
  userName?: string;
  itemName?: string;
  itemUnit?: string;
}

// --- NOVOS TIPOS ---

export interface ToolLoan {
  id?: string;
  siteId: string;
  siteItemId: string; // Referência ao item no estoque da obra
  itemName: string;
  workerName: string; // Nome do pedreiro/responsável
  quantity: number;
  loanDate: Date;
  returnDate?: Date;
  status: 'OPEN' | 'RETURNED';
  notes?: string;
  updatedAt: Date;
}

export interface RentedEquipment {
  id?: string;
  siteId: string;
  name: string;
  supplier: string;
  description?: string;
  
  entryDate: Date;
  entryPhotos: string[]; // Base64 strings
  
  exitDate?: Date;
  exitPhotos?: string[]; // Base64 strings
  
  status: 'ACTIVE' | 'RETURNED';
  updatedAt: Date;
}

export interface ConstructionSite {
  id?: string;
  name: string;
  createdAt: Date;
}

export interface MeasurementUnit {
  id?: string;
  name: string;
  abbreviation: string;
}

export interface ItemCategory {
  id?: string;
  type: 'Produto' | 'Serviço';
  category: string;
  subcategory: string;
  registrationType: 'Próprio' | 'Padrão';
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

export interface LayoutProps {
  children: React.ReactNode;
  bgColor?: string; 
  pageTitle?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}