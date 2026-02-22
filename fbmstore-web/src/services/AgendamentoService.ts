// 1. SERVIÇO PARA GESTÃO DE AGENDAMENTO ONLINE (SAAS)
import api from "./api";

// Interfaces para Tipagem conforme o padrão do projeto
export interface ITenantConfig {
  slug: string;
  logoUrl?: string;
  theme?: any;
}

export interface IAgendamento {
  _id?: string;
  clienteNome: string;
  clienteTelefone: string;
  data: string; // ISO String
  servicoId: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

export const AgendamentoService = {
  
  // --- CONFIGURAÇÃO DO ESTABELECIMENTO (TENANT) ---
  
  // 2. ATUALIZA O SLUG E LOGO DO SALÃO/BARBEARIA
  saveConfig: async (payload: ITenantConfig, token: string) => {
    const { data } = await api.put('/fbm/agendamento/config', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // 3. BUSCA CONFIGURAÇÕES ATUAIS DO TENANT
  getConfig: async (token: string) => {
    const { data } = await api.get('/fbm/agendamento/config', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // --- GESTÃO DE AGENDAMENTOS (DASHBOARD DO PROFISSIONAL) ---

  // 4. LISTA TODOS OS AGENDAMENTOS DO MÊS/DIA
  listAgendamentos: async (token: string) => {
    const { data } = await api.get('/fbm/agendamento/lista', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // 5. ATUALIZA STATUS (EX: CONFIRMAR AGENDAMENTO)
  updateStatus: async (id: string, status: string, token: string) => {
    const { data } = await api.patch(`/fbm/agendamento/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  // --- INTERFACE PÚBLICA (CLIENTE FINAL) ---

  // 6. BUSCA DADOS DO SALÃO PELO SLUG (SEM TOKEN - PÚBLICO)
  getPublicTenantData: async (slug: string) => {
    const { data } = await api.get(`/fbm/agendamento/public/${slug}`);
    return data;
  },

  // 7. CRIA UM NOVO AGENDAMENTO (CLIENTE FINAL NA LANDING PAGE)
  createPublicBooking: async (slug: string, payload: Omit<IAgendamento, '_id' | 'status'>) => {
    const { data } = await api.post(`/fbm/agendamento/public/${slug}/book`, payload);
    return data;
  }
};