import { useOrder } from '@/contexts/OrderContext';
import { useMemo } from 'react';

// Defina aqui o CÓDIGO do produto que libera o acesso (igual está no cadastro do produto)
const FINANCE_PRODUCT_CODE = 'FINAN_LITO_PRO'; 

export function useSubscriptionCheck() {
    const { ordersClient } = useOrder();

    const hasActiveFinance = useMemo(() => {
        // Verifica se existe ALGUM pedido que atenda a todas as condições:
        return ordersClient.some(order => {
            // 1. Status deve ser de sucesso
            const isPaid = ['DONE', 'PAID', 'SUCCESS', 'ACTIVE'].includes(order.statusOrder?.toUpperCase());
            
            if (!isPaid) return false;

            // 2. O pedido deve conter o produto com o código específico
            const hasProduct = order.itemsOrder.some(item => {
                // CORREÇÃO: Adicionado "item &&" para garantir que o item não é undefined/null
                if (item && typeof item !== 'string' && item.product) {
                    return item.product.code === FINANCE_PRODUCT_CODE;
                }
                return false;
            });

            return hasProduct;
        });
    }, [ordersClient]);

    return { hasActiveFinance };
}