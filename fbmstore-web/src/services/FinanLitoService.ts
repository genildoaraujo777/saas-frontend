import api from './api';

export interface ITransaction {
  _id?: string;
  id?: string; // para compatibilidade visual caso precise
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue';
  date: string;
  order?: number; // Novo campo para persistir a posição
}

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
  }
};