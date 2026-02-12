import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { MeasurementUnit, ItemCategory } from '../types';

// Dados padrão extraídos dos relatórios (OCR) - Úteis para importação, mas não exibidos como mock
export const DEFAULT_UNITS: Omit<MeasurementUnit, 'id'>[] = [
  { name: '%', abbreviation: '%' },
  { name: 'Balde', abbreviation: 'Bd' },
  { name: 'Barra', abbreviation: 'BR' },
  { name: 'Bloco', abbreviation: 'BL' },
  { name: 'Caixa', abbreviation: 'CX' },
  { name: 'Conjunto', abbreviation: 'CJ' },
  { name: 'CT', abbreviation: 'CT' },
  { name: 'Dia', abbreviation: 'DIA' },
  { name: 'Dúzia', abbreviation: 'DZ' },
  { name: 'Fardo', abbreviation: 'FD' },
  { name: 'Folha', abbreviation: 'FL' },
  { name: 'Galão', abbreviation: 'GL' },
  { name: 'Hora', abbreviation: 'H' },
  { name: 'Jogo', abbreviation: 'JG' },
  { name: 'Quilômetro', abbreviation: 'KM' },
  { name: 'Quilowatt', abbreviation: 'kW' },
  { name: 'Lata', abbreviation: 'LA' },
  { name: 'Litro', abbreviation: 'L' },
  { name: 'Locação/Mês', abbreviation: 'loc/mês' },
  { name: 'Metro', abbreviation: 'M' },
  { name: 'Metro Cúbico', abbreviation: 'M³' },
  { name: 'Metro Quadrado', abbreviation: 'M²' },
  { name: 'Milheiro', abbreviation: 'MIL' },
  { name: 'Pacote', abbreviation: 'PCT' },
  { name: 'Par', abbreviation: 'PAR' },
  { name: 'Peça', abbreviation: 'PÇ' },
  { name: 'Quilo', abbreviation: 'KG' },
  { name: 'Rolo', abbreviation: 'RL' },
  { name: 'Saca', abbreviation: 'SC' },
  { name: 'Tonelada', abbreviation: 'TON' },
  { name: 'Unidade', abbreviation: 'UN' },
  { name: 'Verba', abbreviation: 'VB' }
];

export const DEFAULT_CATEGORIES: Omit<ItemCategory, 'id'>[] = [
  { type: 'Produto', category: 'Acabamentos', subcategory: 'Pisos, Azulejos e porcelanatos', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Acabamentos', subcategory: 'Rejuntes', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Acabamentos', subcategory: 'Pintura', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Aço', subcategory: '', registrationType: 'Próprio' },
  { type: 'Produto', category: 'Aglomerantes', subcategory: '', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Agregados', subcategory: '', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Aluguel de máquinas', subcategory: 'Andaimes', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Aluguel de máquinas', subcategory: 'Betoneiras', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Elétrica', subcategory: 'Fios e Cabos', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Hidráulica', subcategory: 'Tubos e Conexões', registrationType: 'Padrão' },
  { type: 'Produto', category: 'Madeiras', subcategory: 'Compensados', registrationType: 'Padrão' },
  { type: 'Serviço', category: 'Mão de Obra', subcategory: 'Pedreiro', registrationType: 'Padrão' },
  { type: 'Serviço', category: 'Mão de Obra', subcategory: 'Servente', registrationType: 'Padrão' },
  { type: 'Serviço', category: 'Transporte', subcategory: 'Frete', registrationType: 'Padrão' },
  { type: 'Serviço', category: 'Alimentação', subcategory: 'Refeição', registrationType: 'Padrão' }
];

const UNITS_COLLECTION = 'measurement_units';
const CATEGORIES_COLLECTION = 'item_categories';

export const settingsService = {
  // UNIDADES
  getUnits: async (): Promise<MeasurementUnit[]> => {
    const ref = collection(db, UNITS_COLLECTION);
    const q = query(ref, orderBy("name"));
    const snapshot = await getDocs(q);
    
    // Removido retorno de dados MOCK. Se estiver vazio, retorna vazio.
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MeasurementUnit));
  },

  addUnit: async (unit: Omit<MeasurementUnit, 'id'>) => {
    const ref = collection(db, UNITS_COLLECTION);
    await addDoc(ref, unit);
  },

  updateUnit: async (id: string, unit: Partial<MeasurementUnit>) => {
    const ref = doc(db, UNITS_COLLECTION, id);
    await updateDoc(ref, unit);
  },

  deleteUnit: async (id: string) => {
    const ref = doc(db, UNITS_COLLECTION, id);
    await deleteDoc(ref);
  },

  importDefaultUnits: async () => {
    const batch = writeBatch(db);
    const ref = collection(db, UNITS_COLLECTION);
    
    DEFAULT_UNITS.forEach(unit => {
      const newDocRef = doc(ref);
      batch.set(newDocRef, unit);
    });

    await batch.commit();
  },

  // CATEGORIAS
  getCategories: async (): Promise<ItemCategory[]> => {
    const ref = collection(db, CATEGORIES_COLLECTION);
    const q = query(ref, orderBy("category"));
    const snapshot = await getDocs(q);

    // Removido retorno de dados MOCK
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ItemCategory));
  },

  addCategory: async (category: Omit<ItemCategory, 'id'>) => {
    const ref = collection(db, CATEGORIES_COLLECTION);
    await addDoc(ref, category);
  },

  updateCategory: async (id: string, category: Partial<ItemCategory>) => {
    const ref = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(ref, category);
  },

  deleteCategory: async (id: string) => {
    const ref = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(ref);
  },

  importDefaultCategories: async () => {
    const batch = writeBatch(db);
    const ref = collection(db, CATEGORIES_COLLECTION);
    
    DEFAULT_CATEGORIES.forEach(cat => {
      const newDocRef = doc(ref);
      batch.set(newDocRef, cat);
    });

    await batch.commit();
  }
};