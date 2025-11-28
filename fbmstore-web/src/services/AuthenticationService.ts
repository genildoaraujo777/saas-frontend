import { Address, Person, Register } from "@/types";
import api from "./api";

export async function login(email: string, password: string) {
    if (!email || !password) return null;

    try {
        const result = await api.post('/spg/clients/login', {
            email, password
        });

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function register(loginData: Register, person: Person, address: Address) {
    if (!loginData || !person || !address) return null;
    try {
        const result = await api.post('/spg/clients', {
            loginData, person, address
        });

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function updateRegister(clientId: string, person: Person, address: Address) {
    if (!clientId || !person || !address) return null;
    try {
        const result = await api.put(`/spg/clients/update-register/${clientId}`, {
            person, address
        });
        return result.status;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function sendResetPasswordCode(email: string) {
    if (!email) return null;
    try {
        const result = await api.post('/spg/clients/reset-password', {
            email
        });

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function searchCodeReset(code: string) {
    if (!code) return null;
    try {
        const result = await api.get(`/spg/clients/reset-password/${code}`);

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function searchAccountData(adminClientId: string, token: string) {
    if (!token) return null;
    try {
        const result = await api.get(`/spg/clients/account-data/${adminClientId}`, { headers: { Authorization: `Bearer ${token}` } });
        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function clientSession(token: string) {
    if (!token) return null;
    try {
        const result = await api.get(`/spg/clients/session`, { headers: { Authorization: `Bearer ${token}` } });
        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function resetRegister(resetData: any) {
    if (!resetData) return null;
    try {
        const result = await api.post(`/spg/clients/update-password`, resetData);

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function checkTokenValidity(token: string) {
    try {
        const response = await api.get(`/spg/auth/check-expiration`, { headers: { Authorization: `Bearer ${token}` } });
        
        // Agora retorna: true se for VÁLIDO (expired: false) e false se for INVÁLIDO (expired: true)
        return !response.data.expired; 
        
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        // Cai no catch se a API retornar 401/403/500, então é INVÁLIDO.
        return false; // Retorna false (inválido)
    }
};
