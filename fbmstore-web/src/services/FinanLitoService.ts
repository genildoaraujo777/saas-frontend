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
    // A API espera month (0-11) e year.
    const params = (month !== undefined && year) ? { month, year } : {};
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await api.get<ITransaction[]>('/fbm/transactions', { params, headers });
    
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