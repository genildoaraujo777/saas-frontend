// src/contexts/OrderContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'; // <-- Importei useCallback
import { Order, OrderResponse } from '@/types';
import api from '@/services/api';

interface OrderContextType {
  ordersClient: Order[];
  updateOrder: (orderId: string, quantityChange: number) => void;
  searchOrders: (clientId: string, isAdmin: boolean) => Promise<Order[]>;
  createOrder: (newOrder: Order, token?: string) => Promise<Order>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Funções auxiliares movidas para fora do componente para garantir estabilidade (não mudam a cada render)
const resolveToken = (maybeToken?: string) =>
  maybeToken ?? localStorage.getItem('token') ?? undefined;

const formatDateToDDMMYYYY = (isoDate: string) => {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); 
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);


export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ordersClient, setOrderItems] = useState<Order[]>([]);

  // Memoriza updateOrder
  const updateOrder = useCallback((orderId: string, quantityChange: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item._id === orderId ? { ...item, quantityItems: quantityChange } : item
      )
    );
  }, []);

  // Memoriza sendWhatsApp
  const sendWhatsApp = useCallback((newOrder: Order) => {
    let clientName = '';
    if (typeof newOrder.client !== 'string' && newOrder.client?.name) {
      clientName = newOrder.client.name;
    } else {
      console.log('Client data is missing or is not populated correctly.');
    }

    const orderText = `
*Pedido Nº:* ${newOrder.numberOrder}
*Data:* ${formatDateToDDMMYYYY(newOrder.createdAt!)}
*Cliente:* ${clientName}
*------------------------------------------*
*Itens do Pedido:* ${newOrder.itemsOrder
  .map((item) =>
    typeof item !== 'string' && item
      ? `
*------------------------------------------*
*Produto:* ${item.product.description}
*Fornecedor:* ${item.product.supplier.name}
*Preço Embalagem:* ${item.product.price}
*Preço Unitário:* ${item.product.unitPrice}
*Quantidade:* ${item.quantity}
`
      : ''
  )
  .join('\n')}
*------------------------------------------*
*Total do Pedido:* ${formatCurrency(newOrder.totalPrice)}
`;

    // Web: usa URL pública do WhatsApp
    const url = `https://wa.me/5511944688144?text=${encodeURIComponent(orderText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []); // Dependências: As funções formatCurrency e formatDateToDDMMYYYY são estáveis (estão fora)

  // Memoriza createOrder
  const createOrder = useCallback(async (newOrder: Order, token?: string) => {
    console.log('newOrder: ',newOrder);
    const auth = resolveToken(token);
    if (!auth) {
      window.alert('Erro!!! Sua sessão expirou, faça login novamente.');
      throw new Error('Token not provided');
    }

    const response = await api.post<OrderResponse>(
      `/fbm/orders`,
      { newOrder },
      { headers: { Authorization: `Bearer ${auth}` } }
    );

    const created = response.data as unknown as Order;

    setOrderItems((prev) => [...prev, created]);
    // sendWhatsApp(created);
    return created;
  }, [sendWhatsApp]); // setOrderItems é uma função de estado e é estável.

  // 🟢 CORREÇÃO CRÍTICA: Memoriza searchOrders.
  // O array de dependências vazio ([]) garante que a função NUNCA mude,
  // resolvendo o loop infinito no OrdersScreen.tsx.
  const searchOrders = useCallback(async (token: string, isAdmin: boolean) => {
    const auth = resolveToken(token);
    if (!auth) {
      window.alert('Erro!!! Sua sessão expirou, faça login novamente.');
      throw new Error('Token not provided');
    }

    // Faz a requisição usando o token no cabeçalho 'Authorization'
    const response = await api.get<Order[]>(
      `/fbm/orders/${isAdmin}`,
      { headers: { Authorization: `Bearer ${auth}` } }
    );

    const orders = [...response.data].sort(
      (a: { numberOrder: number }, b: { numberOrder: number }) => b.numberOrder - a.numberOrder
    );
    setOrderItems(orders);
    return orders;
  }, []); // <-- ARRAY DE DEPENDÊNCIAS VAZIO!

  return (
    <OrderContext.Provider value={{ ordersClient, updateOrder, createOrder, searchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within a OrderProvider');
  }
  return context;
};