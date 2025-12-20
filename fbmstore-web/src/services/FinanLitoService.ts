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
}

export const FinanLitoService = {
  getAll: async (month?: number, year?: number, token?: string) => {
    // CORREÇÃO: Constrói os parâmetros individualmente
    const params: any = {};
    if (year) params.year = year;
    if (month !== undefined) params.month = month;

    const { data } = await api.get<ITransaction[]>('/fbm/transactions', { // ou /fbm/transactions dependendo da sua rota
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    return data;
  },
  replicate: async (month: number, year: number, token?: string) => {
    // Chama a rota nova passando o mês/ano ATUAL que queremos clonar
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

  delete: async (id: string, token: string) => {
    await api.delete(`/fbm/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } } );
  }
};