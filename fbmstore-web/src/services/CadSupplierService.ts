// fbm-web/src/services/CadSupplierService.ts
import api from "./api";
import { Supplier } from "@/types";

const SUPPLIER_ENDPOINT = "/fbm/suppliers";

/**
 * Cria um novo fornecedor.
 * @param name O nome do fornecedor.
 */
export async function createSupplier(token: string, name: string) {
  try {
    // e o objeto de configuração, incluindo os headers, no 3º argumento.
    const result = await api.post(
      SUPPLIER_ENDPOINT, 
      { name }, // 2º argumento: Corpo (Body)
      { headers: { Authorization: `Bearer ${token}` } } // 3º argumento: Configuração (Headers)
    );
    
    return result.data; 
  } catch (error) {
    console.error("[CadSupplierService] Erro ao criar fornecedor:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao criar fornecedor" };
  }
}

/**
 * Lista todos os fornecedores.
 */
export async function listSuppliers(): Promise<Supplier[]> {
  try {
    const result = await api.get<Supplier[]>(SUPPLIER_ENDPOINT);
    return result.data;
  } catch (error) {
    console.error("[CadSupplierService] Erro ao listar fornecedores:", error);
    return [];
  }
}

/**
 * Edita um fornecedor existente.
 * @param supplierId O ID do fornecedor.
 * @param name O novo nome.
 */
export async function editSupplier(token: string, supplierId: string, name: string) {
  try {
    const result = await api.put(`${SUPPLIER_ENDPOINT}/${supplierId}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
    return result.status; // Espera-se 204
  } catch (error) {
    console.error("[CadSupplierService] Erro ao editar fornecedor:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao editar fornecedor" };
  }
}

/**
 * Deleta um fornecedor.
 * @param supplierId O ID do fornecedor.
 */
export async function deleteSupplier(token: string, supplierId: string) {
  try {
    const result = await api.delete(`${SUPPLIER_ENDPOINT}/${supplierId}`, { headers: { Authorization: `Bearer ${token}` } });
    return result.status; // Espera-se 204
  } catch (error) {
    console.error("[CadSupplierService] Erro ao deletar fornecedor:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao deletar fornecedor" };
  }
}