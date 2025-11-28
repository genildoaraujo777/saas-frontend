// src/services/AdminService.ts
import { User } from "@/types";
import api from "./api"; // Presume a importação do serviço 'api'

/**
 * Busca a lista completa de clientes (Users) no endpoint administrativo.
 * Requer o token de um administrador.
 * @param token O token JWT do usuário administrador.
 * @returns Um array de clientes (User[]) ou null em caso de falha.
 */
export async function listAllClients(token: string): Promise<User[] | null> {
    if (!token) return null;

    try {
        // Chama a rota protegida por Admin (implementada no SPG-API)
        const result = await api.get('/spg/admin/clients', { 
            headers: { Authorization: `Bearer ${token}` } 
        });

        return result.data as User[]; 
    } catch (error) {
        console.error('Erro ao listar clientes (Admin):', error);
        // Em um ambiente real, você trataria erros 401/403 (Não Autorizado/Permitido)
        return null; 
    }
}