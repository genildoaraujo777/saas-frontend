import { ITransaction } from '@/types';
import api from './api';

export const FinanLitoService = {
  getAll: async (month?: number, year?: number, token?: string) => {
    const params: any = {};
    if (year) params.year = year;
    if (month !== undefined) params.month = month;

    const { data } = await api.get<ITransaction[]>('/fbm/transactions', {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    return data;
  },

  replicate: async (month: number, year: number, token?: string) => {
    const { data } = await api.post('/fbm/transactions/replicate', { month, year }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return data;
  },

  create: async (payload: Omit<ITransaction, '_id' | 'id'>, token: string) => {
    const { data } = await api.post('/fbm/transactions', payload, { headers: { Authorization: `Bearer ${token}` } } );
    return data;
  },

  update: async (id: string, payload: Partial<ITransaction>, token: string) => {
    await api.put(`/fbm/transactions/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } } );
  },

  // NOVO MÉTODO: Padronizado com api.put
  updateOrder: async (items: { id: string, order: number }[], token: string) => {
    // Envia um payload { items: [...] } para a rota de reordenação
    await api.put('/fbm/transactions/reorder', { items }, { 
        headers: { Authorization: `Bearer ${token}` } 
    });
  },

  delete: async (id: string, token: string) => {
    await api.delete(`/fbm/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } } );
  },

  // 6. MÉTODO PARA SCAN DE NOTA FISCAL (OCR) - Envia a imagem para o backend processar e retornar os dados extraídos
  scanNfcE: async (formData: FormData, token: string) => {
    const { data } = await api.post('/files/ocr', formData, { headers: { Authorization: `Bearer ${token}` } } );
    return data;
  },
  
  importFromNfceUrl: async (url: string, token: string) => {
    // Enviamos a URL no corpo da requisição (body)
    const { data } = await api.post('/fbm/transactions/import-nfce', 
      { url }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data; // Retorna a lista de produtos [{ name, price, qty... }]
  },
};