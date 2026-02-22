import React, { createContext, useContext, useEffect, useState } from 'react';
import { useClient } from './ClientContext';

// 1. Definição do Tema (Cores)
interface ThemeColors {
  primary: string;    // Cor principal (Botões, Header)
  background: string; // Fundo da tela
  income: string;     // Cor de Receita/Sucesso
  expense: string;    // Cor de Despesa/Erro
  text: string;       // Cor principal de texto
}

// 2. Definição do Dicionário (Termos)
interface Terminology {
  appName: string;    // Nome no Topo (Ex: "Barber Finance")
  income: string;     // Ex: "Cortes", "Corridas", "Dízimos"
  expense: string;    // Ex: "Produtos", "Gasolina", "Custos"
  logoUrl?: string;   // URL da logo customizada
}

interface TenantContextType {
  colors: ThemeColors;
  terms: Terminology;
  isLoadingTheme: boolean;
  tenantSlug: string | null; // NOVO: Slug extraído da URL
  isRoot: boolean;           // NOVO: Define se é o site principal
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// PRESETS (A Mágica acontece aqui: Configurações pré-prontas)
// 1. ESTRUTURA DE PRESETS PROFISSIONAL E EXPANSÍVEL
// 1. PRESETS SIMPLIFICADOS PARA O MOTOR DE TEMAS
const PRESETS: Record<string, { colors: ThemeColors, terms: Terminology }> = {
  default: {
    colors: { primary: '#2563eb', background: '#f8fafc', income: '#16a34a', expense: '#dc2626', text: '#0f172a' },
    terms: { appName: 'FBM Store', income: 'Receitas', expense: 'Despesas' }
  },
  // O tema 'agendamento' será o padrão para quem assinar o novo produto
  agendamento: {
    colors: { primary: '#000000', background: '#ffffff', income: '#16a34a', expense: '#dc2626', text: '#000000' },
    terms: { appName: 'Agenda Online', income: 'Serviços', expense: 'Custos' }
  }
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loggedClient } = useClient();
  const [config, setConfig] = useState(PRESETS.default);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [isRoot, setIsRoot] = useState(true);

  // 1. EXTRAÇÃO DO SUBDOMÍNIO (TENANT)
  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Se houver subdomínio (Ex: barbearia.fbmstore.com.br -> parts.length > 3)
    if (parts.length > 3) {
      const slug = parts[0];
      if (slug !== 'www' && slug !== 'gateway') {
        setTenantSlug(slug);
        setIsRoot(false);
      }
    }
  }, []);

  // 2. LÓGICA DE SELEÇÃO DE TEMA (MANTIDA E AJUSTADA)
  useEffect(() => {
    if (loggedClient) {
      if (loggedClient.client.name.toLowerCase().includes('barber')) {
        setConfig(PRESETS.barber);
      } else if (loggedClient.client.name.toLowerCase().includes('igreja')) {
        setConfig(PRESETS.church);
      } else {
        setConfig(PRESETS.default);
      }
    }
  }, [loggedClient]);

  return (
    <TenantContext.Provider value={{ ...config, isLoadingTheme: false, tenantSlug, isRoot }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};