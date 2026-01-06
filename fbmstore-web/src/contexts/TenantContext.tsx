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
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// PRESETS (A Mágica acontece aqui: Configurações pré-prontas)
const PRESETS: Record<string, { colors: ThemeColors, terms: Terminology }> = {
  default: {
    colors: { primary: '#2563eb', background: '#f8fafc', income: '#16a34a', expense: '#dc2626', text: '#0f172a' },
    terms: { appName: 'FBM Finanças', income: 'Receitas', expense: 'Despesas' }
  },
  barber: { // Exemplo para Barbearias
    colors: { primary: '#000000', background: '#1c1c1c', income: '#eab308', expense: '#ef4444', text: '#ffffff' },
    terms: { appName: 'Barber Control', income: 'Serviços', expense: 'Gastos Loja' }
  },
  church: { // Exemplo para Igrejas
    colors: { primary: '#7c3aed', background: '#f5f3ff', income: '#059669', expense: '#b91c1c', text: '#4c1d95' },
    terms: { appName: 'Tesouraria Digital', income: 'Dízimos/Ofertas', expense: 'Saídas' }
  }
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loggedClient } = useClient();
  const [config, setConfig] = useState(PRESETS.default);

  useEffect(() => {
    // LÓGICA DE SELEÇÃO DE TEMA
    // Aqui você decide qual tema carregar baseado no perfil do cliente logado.
    // Pode vir do banco de dados (loggedClient.theme) ou inferir pelo nome/email.
    
    if (loggedClient) {
        // Exemplo: Se tiver um campo 'segment' no seu banco ou baseado no email
        // const segment = loggedClient.segment || 'default';
        
        // Simulação: Se o nome conter "Barber", usa o tema dark
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
    <TenantContext.Provider value={{ ...config, isLoadingTheme: false }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};