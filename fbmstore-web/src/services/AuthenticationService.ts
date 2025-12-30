import { Address, Person, Register } from "@/types";
import api from "./api";

export async function login(email: string, password: string) {
    if (!email || !password) return null;

    try {
        const result = await api.post('/auth/clients/login', {
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
        const result = await api.post('/auth/clients', {
            loginData, person, address
        });
console.log('result: ',result);
        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function updateRegister(clientId: string, person: Person, address: Address, token: string) {
    if (!clientId || !person || !address) return null;
    try {
        const result = await api.put(`/auth/clients/update-register/${clientId}`, 
            {
              person, address
            },
            { headers: { Authorization: `Bearer ${token}` } }, 
        );
        return result.status;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function searchCodeReset(code: string) {
    if (!code) return null;
    try {
        const result = await api.get(`/auth/clients/reset-password/${code}`);

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function searchAccountData(adminClientId: string, token: string) {
    if (!token) return null;
    try {
        const result = await api.get(`/auth/clients/account-data/${adminClientId}`, { headers: { Authorization: `Bearer ${token}` } });
        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function clientSession(token: string) {
    if (!token) return null;
    try {
        const result = await api.get(`/auth/clients/session`, { headers: { Authorization: `Bearer ${token}` } });
        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function resetRegister(resetData: any) {
    if (!resetData) return null;
    try {
        const result = await api.post(`/auth/clients/update-password`, resetData);

        return result.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function checkTokenValidity(token: string) {
    try {
        const response = await api.get(`/auth/clients/check-expiration`, { headers: { Authorization: `Bearer ${token}` } });
        
        // Agora retorna: true se for VÁLIDO (expired: false) e false se for INVÁLIDO (expired: true)
        return !response.data.expired; 
        
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        // Cai no catch se a API retornar 401/403/500, então é INVÁLIDO.
        return false; // Retorna false (inválido)
    }
}

export async function validateActivationCode(code: string) {
  try {
    const response = await api.get(`/auth/clients/active/${code}`);
    return response.data;
  } catch (error: any) {
    console.error("Erro na ativação:", error);
    // Retorna erro padronizado caso a API falhe
    return error.response?.data || { isValidCode: false, msg: "Erro ao validar código." };
  }
}

// 1. Enviar Código de Recuperação
export async function sendResetPasswordCode(email: string) {
  try {
    // POST /auth/clients/reset-password
    const response = await api.post('/auth/clients/reset-password', { email });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, msg: "Erro ao enviar código." };
  }
}

// 2. Validar o Código (Igual ao de ativação, mas para reset)
export async function validateResetCode(code: string) {
  try {
    // GET /auth/clients/reset-password/:code
    const response = await api.get(`/auth/clients/reset-password/${code}`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { isValid: false, msg: "Código inválido." };
  }
}

// 3. Atualizar a Senha
export async function updatePassword(loginData: any) {
  try {
    // POST /auth/clients/update-password
    // Espera: { email, code, newPassword, confirmNewPassword }
    const response = await api.post('/auth/clients/update-password', loginData);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, msg: "Erro ao atualizar senha." };
  }
}
