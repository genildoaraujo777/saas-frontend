// spg-web/src/services/CadCategoryService.ts
import api from "./api";
import { Category } from "@/types";

const CATEGORY_ENDPOINT = "/spg/categories";

/**
 * Cria uma nova categoria.
 * @param name O nome da categoria.
 */
export async function createCategory(token: string, name: string) {
  try {
    // e o objeto de configuração, incluindo os headers, no 3º argumento.
    const result = await api.post(
      CATEGORY_ENDPOINT, 
      { name }, // 2º argumento: Corpo (Body)
      { headers: { Authorization: `Bearer ${token}` } } // 3º argumento: Configuração (Headers)
    );
    
    return result.data; 
  } catch (error) {
    console.error("[CadCategoryService] Erro ao criar categoria:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao criar categoria" };
  }
}

/**
 * Lista todas as categorias.
 */
export async function listCategories(): Promise<Category[]> {
  try {
    const result = await api.get<Category[]>(CATEGORY_ENDPOINT);
    return result.data;
  } catch (error) {
    console.error("[CadCategoryService] Erro ao listar categorias:", error);
    return [];
  }
}

/**
 * Edita uma categoria existente.
 * @param categoryId O ID da categoria.
 * @param name O novo nome.
 */
export async function editCategory(token: string, categoryId: string, name: string) {
  try {
    const result = await api.put(`${CATEGORY_ENDPOINT}/${categoryId}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
    return result.status; // Espera-se 204
  } catch (error) {
    console.error("[CadCategoryService] Erro ao editar categoria:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao editar categoria" };
  }
}

/**
 * Deleta uma categoria.
 * @param categoryId O ID da categoria.
 */
export async function deleteCategory(token: string, categoryId: string) {
  try {
    const result = await api.delete(`${CATEGORY_ENDPOINT}/${categoryId}`, { headers: { Authorization: `Bearer ${token}` } });
    return result.status; // Espera-se 204
  } catch (error) {
    console.error("[CadCategoryService] Erro ao deletar categoria:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao deletar categoria" };
  }
}