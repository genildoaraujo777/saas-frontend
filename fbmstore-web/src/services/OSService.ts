import api from "./api";

// Interfaces para Tipagem
export interface IOSProduct {
  _id?: string;
  id?: string;
  nome: string;
  preco: number;
  description?: string;
}

export interface IOSTemplate {
  customFieldsLayout: any;
  defaultTermosGarantia: string;
}

export const OSService = {
  // --- GESTÃO DE ORDENS DE SERVIÇO (OS) ---
  saveOS: async (payload: any, token: string) => {
    const { data } = await api.post('/fbm/oslito/os-data', payload, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  listOS: async (token: string) => {
    const { data } = await api.get('/fbm/oslito/os-data', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  getOSById: async (id: string, token: string) => {
    const { data } = await api.get(`/fbm/oslito/os-data/${id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  updateOS: async (id: string, payload: any, token: string) => {
    const { data } = await api.put(`/fbm/oslito/os-data/${id}`, payload, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  deleteOS: async (id: string, token: string) => {
    const { data } = await api.delete(`/fbm/oslito/os-data/${id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  // --- GESTÃO DE TEMPLATES ---
  getTemplate: async (token: string) => {
    const { data } = await api.get('/fbm/oslito/os-templates', { // Adicionado /oslito
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  saveTemplate: async (payload: IOSTemplate, token: string) => {
    const { data } = await api.post('/fbm/oslito/os-templates', payload, { // Adicionado /oslito
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  // --- GESTÃO DE PRODUTOS/CATÁLOGO ---
  listProducts: async (token: string) => {
    const { data } = await api.get('/fbm/oslito/products', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  createProduct: async (product: Omit<IOSProduct, 'id'>, token: string) => {
    const { data } = await api.post('/fbm/oslito/products', product, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  updateProduct: async (id: string, product: IOSProduct, token: string) => {
    const { data } = await api.put(`/fbm/oslito/products/${id}`, product, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  },

  deleteProduct: async (id: string, token: string) => {
    const { data } = await api.delete(`/fbm/oslito/products/${id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return data;
  }
};