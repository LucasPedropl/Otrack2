import { siteInventoryService } from './siteInventoryService';
import { EPIWithdrawal } from '../types';

export const epiService = {
  // Registra a retirada de EPI e atualiza o estoque
  registerWithdrawal: async (siteId: string, withdrawal: Omit<EPIWithdrawal, 'id'>) => {
    // 1. Atualizar o estoque (reduzir quantidade)
    // Apenas registra o movimento no inventário. Não cria coleção separada para evitar erro de permissão.
    await siteInventoryService.registerMovement(siteId, withdrawal.itemId, {
      type: 'OUT',
      quantity: withdrawal.quantity,
      reason: 'Retirada de EPI', // Identificador chave
      userId: withdrawal.collaboratorId,
      userName: withdrawal.collaboratorName,
      itemName: withdrawal.itemName
    });
  },

  // Busca histórico de retiradas de EPI da obra (via movimentos de estoque)
  getWithdrawals: async (siteId: string): Promise<EPIWithdrawal[]> => {
    const allMovements = await siteInventoryService.getAllSiteMovements(siteId);
    
    // Filtra apenas movimentos que são retiradas de EPI
    return allMovements
      .filter(m => m.reason === 'Retirada de EPI' || m.reason?.includes('EPI'))
      .map(m => ({
        id: m.id,
        siteId,
        collaboratorId: m.userId || '',
        collaboratorName: m.userName || 'Desconhecido',
        itemId: '', // O ID do item não vem direto no movimento plano, mas podemos tentar recuperar se necessário, ou ajustar o tipo
        itemName: m.itemName || 'Item',
        quantity: m.quantity,
        date: m.date,
        notes: m.reason
      } as EPIWithdrawal));
  },

  // Busca histórico por colaborador
  getWithdrawalsByCollaborator: async (siteId: string, collaboratorId: string): Promise<EPIWithdrawal[]> => {
    const all = await epiService.getWithdrawals(siteId);
    return all.filter(w => w.collaboratorId === collaboratorId);
  }
};
