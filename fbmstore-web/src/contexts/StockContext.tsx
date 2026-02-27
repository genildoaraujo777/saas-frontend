// src/contexts/StockContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CartItem } from '@/types';
import api from '@/services/api';

interface StockContextType {
  stockItems: CartItem[];
  updateStock: (productId: string, quantityChange: number) => void;
  fetchMoreProducts: () => void; // Função para carregar mais produtos
  notIsLoading: boolean;
  fetchStockItemsByQuery: (query: string, categoryId?: string, supplierId?: string) => Promise<CartItem[]>; // Função para carregar mais produtos
  isLoading: boolean;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<CartItem[]>([]);
  const [notIsLoading, setNotIsLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1); // Controle da página atual
  const limit = 5; // Limite de 10 produtos por página

  // helpers (web) para substituir AsyncStorage
  const getLocal = (k: string) => {
    try { return localStorage.getItem(k); } catch { return null; }
  };
  const setLocal = (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch {}
  };

  // Armazena a última atualização (mantém entre renders)
  const lastUpdatedAt = useRef<string | null>(null);

  // Função para buscar produtos com paginação
  const fetchStockItems = async () => {
    try {
      setIsLoading(true); // inicia loading
      const response = await api.get(`/fbm/products`, {
        params: { page, limit },
      });

      if (response.data.products.length === 0) {
        setNotIsLoading(true);
      } else {
        setStockItems((prev) => {
          const existingIds = new Set(prev.map((item) => item._id));
          const newItems = response.data.products.filter(
            (item: { _id: string | undefined }) => !existingIds.has(item._id)
          );
        return [...prev, ...newItems];
        });
        setNotIsLoading(false);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setIsLoading(false); // finaliza loading
    }
  };

  const fetchStockItemsByQuery = async (query: string, categoryId?: string, supplierId?: string): Promise<CartItem[]> => {
    try {
      const response = await api.get(
        `/fbm/products/search?search=${encodeURIComponent(query)}&categoryId=${categoryId ?? ''}&supplierId=${supplierId ?? ''}`
      );
      return response.data.products as CartItem[]; // traz a lista de produtos com base na pesquisa
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  };

  // Carrega os produtos iniciais quando o componente monta
  useEffect(() => {
    // Verifica a quantidade de itens e busca atualizações
    fetchStockItems();
  }, [page]); // Sempre que a página mudar

  // Função para carregar mais produtos (próxima página)
  const fetchMoreProducts = () => {
    setNotIsLoading(false);
    setPage((prevPage) => prevPage + 1); // Incrementa a página para carregar mais produtos
  };

  const updateStock = (productId: string, quantityChange: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, quantityStock: item.quantityStock + quantityChange }
          : item
      )
    );
  };

  const verifyQtdAndUpdateProducts = async () => {
    try {
      const response = await api.get(`/fbm/products/count`);
      const count = getLocal('countProducts');

      if (page === 1) {
        await fetchStockItems(); // Busca a lista completa ou apenas os novos itens
      } else if (count && count !== String(response.data.count) && page !== 1) {
        await fetchStockItems(); // Busca a lista completa ou apenas os novos itens
      } else {
        await fetchUpdatedItems(); // Busca itens modificados
      }
      setLocal('countProducts', response.data.count.toString());
    } catch (error) {
      console.error('Erro ao verificar a quantidade de itens:', error);
    }
  };

  const fetchUpdatedItems = async () => {
    try {
      const response = await api.get(`/fbm/products/updated`, {
        params: {
          lastUpdatedAt: lastUpdatedAt.current, // Envia a última data de atualização
        },
      });

      const { products, lastUpdated } = response.data;

      if (products.length > 0) {
        setStockItems((prev) =>
          prev.map((item) => products.find((updated: { _id: string | undefined }) => updated._id === item._id) || item)
        );
        lastUpdatedAt.current = lastUpdated; // Atualiza o timestamp da última alteração
      } else {
      }
    } catch (error) {
      console.error('Erro ao buscar itens atualizados:', error);
    }
  };

  return (
    <StockContext.Provider
      value={{
        stockItems,
        updateStock,
        fetchMoreProducts,
        fetchStockItemsByQuery,
        notIsLoading,
        isLoading,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
