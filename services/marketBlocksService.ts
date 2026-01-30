import api from './api';
import { MarketBlock } from '../types';

/**
 * Salvar blocos de mercado no backend
 */
export const saveMarketBlocks = async (blocks: MarketBlock[]): Promise<boolean> => {
  try {
    const response = await api.post('/market-blocks', { blocks });
    console.log('✅ Blocos de mercado salvos no backend:', blocks.length);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar blocos no backend:', error);
    return false;
  }
};

/**
 * Buscar blocos de mercado do backend
 */
export const getMarketBlocks = async (): Promise<MarketBlock[] | null> => {
  try {
    const response = await api.get('/market-blocks');
    const data = response.data.data;
    
    if (data && Array.isArray(data)) {
        console.log(`✅ Blocos de mercado recuperados do backend:`, data.length);
        return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar blocos do backend:', error);
    return null;
  }
};

/**
 * Deletar todos os blocos de mercado do backend
 */
export const deleteAllMarketBlocks = async (): Promise<boolean> => {
  try {
    const response = await api.delete('/market-blocks');
    console.log('✅ Blocos de mercado deletados no backend:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar blocos no backend:', error);
    return false;
  }
};
