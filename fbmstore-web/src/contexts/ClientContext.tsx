import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/services/api'; 

// Interface do Cliente (User)
export interface Client {
    client: {
        _id: string;
        name: string;
        telephone?: string;
        email?: string;
    }
    profileId: number; // Ex: 1 (Cliente), 99 (Admin)
    // Adicione outros campos conforme seu banco de dados
}

interface ClientContextType {
    clients: Client[];             // Lista de TODOS os clientes (visão admin)
    loggedClient: Client | null;   // O Cliente LOGADO atualmente
    isAdmin: boolean;              // Helper para saber se é admin rápido
    fetchClients: (token: string) => Promise<Client[]>;
    fetchLoggedUserProfile: (token: string) => Promise<Client | null>;
    logoutClient: () => void;
    setIsAdmin: (isAdmin: boolean) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loggedClient, setLoggedClient] = useState<Client | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(loggedClient?.profileId === 99);

    // 1. Busca a lista geral de clientes (Geralmente uso de ADMIN)
    const fetchClients = useCallback(async (token: string) => {
        try {
            const response = await api.get<Client[]>('/auth/admin/clients', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setClients(response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar lista de clientes:', error);
            return [];
        }
    }, []);

    // 2. Busca os dados do usuário LOGADO (Sessão Atual)
    const fetchLoggedUserProfile = useCallback(async (token: string) => {
        try {
            // ⚠️ AJUSTE A ROTA: Geralmente é '/session', '/me' ou '/profile'
            // Se não tiver rota dedicada, e você tiver o ID no localStorage, pode usar /clients/:id
            const response = await api.get<Client>('/auth/clients/session', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            setLoggedClient(response.data);
            
            // Opcional: Atualizar localStorage para persistência básica
            if (response.data.profileId === 99) {
                setIsAdmin(true);
            }

            return response.data;
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário logado:', error);
            return null;
        }
    }, []);

    const logoutClient = useCallback(() => {
        setLoggedClient(null);
        setClients([]);
        setIsAdmin(false);
        localStorage.clear();
        // Aqui você pode forçar um redirect se necessário, mas idealmente o componente reage ao state
        // MUDANÇA AQUI: Força o navegador a ir para a Home e recarregar a página
        window.location.href = '/';
    }, []);

    // Opcional: Tentar recuperar o usuário logado ao recarregar a página se tiver token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !loggedClient) {
            fetchLoggedUserProfile(token);
        }
    }, [fetchLoggedUserProfile, loggedClient]);

    return (
        <ClientContext.Provider value={{ 
            clients, 
            loggedClient, 
            isAdmin,
            fetchClients, 
            fetchLoggedUserProfile,
            logoutClient,
            setIsAdmin
        }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
};