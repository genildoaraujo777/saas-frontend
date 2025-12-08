// fbm-web/src/services/CadProductService.ts
import api from "./api";
import { Product } from "@/types";

const PRODUCT_ENDPOINT = "/fbm/products";

// Tipo para os dados do produto que serão enviados (com IDs de Categoria/Fornecedor em string)
type ProductPayload = Omit<Product, 'category' | 'supplier'> & { category: string, supplier: string };

/**
 * Cria um novo produto.
 * @param product Os dados do produto (incluindo IDs de category e supplier).
 */
export async function createProduct(token: string, product: ProductPayload) {
  try {
    const result = await api.post(PRODUCT_ENDPOINT, product, { headers: { Authorization: `Bearer ${token}` } });
    return result.data; // Espera-se Product (populado)
  } catch (error) {
    console.error("[CadProductService] Erro ao criar produto:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao criar produto" };
  }
}

/**
 * Lista todos os produtos (sem paginação).
 */
export async function listAllProducts(): Promise<Product[]> {
  try {
    // Usando o endpoint de listagem que retorna { products: Product[] }
    const result = await api.get<{ products: Product[] }>(PRODUCT_ENDPOINT);
    return result.data.products;
  } catch (error) {
    console.error("[CadProductService] Erro ao listar produtos:", error);
    return [];
  }
}

/**
 * Edita um produto existente.
 * @param productId O ID do produto.
 * @param product Os dados do produto atualizados.
 */
export async function editProduct(token: string, productId: string, product: ProductPayload) {
  try {
    const result = await api.put(`${PRODUCT_ENDPOINT}/${productId}`, product, { headers: { Authorization: `Bearer ${token}` } });
    return result.data; // Espera-se Product (populado)
  } catch (error) {
    console.error("[CadProductService] Erro ao editar produto:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.message || error.response?.data?.error || "Erro de conexão ao editar produto" };
  }
}

/**
 * Deleta um produto.
 * @param productId O ID do produto.
 */
export async function deleteProduct(token: string, productId: string) {
  try {
    // Rota específica: /products/:productId
    const result = await api.delete(`${PRODUCT_ENDPOINT}/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
    return result.status; // Espera-se 200
  } catch (error) {
    console.error("[CadProductService] Erro ao deletar produto:", error);
    // @ts-ignore
    return { error: true, msg: error.response?.data?.error || "Erro de conexão ao deletar produto" };
  }
}