// src/routes/OrderDetailsScreen.tsx
import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import { useOrder } from '@/contexts/OrderContext';
import { CartItem, Order, Product } from '@/types'; // Importado CartItem para uso no mapeamento
import React, { useEffect, useState } from 'react'; // Removido useMemo
import { useNavigate, useParams } from 'react-router-dom';

const OrderDetailsScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { ordersClient } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const navigation = useNavigate();
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Função para renderizar o Header (Substitui o useMemo e simplifica o estilo)
  const renderHeader = () => (
    <header style={styles.header}>
      <button
        onClick={() => navigation(-1)}
        style={styles.backBtn}
      >
        Voltar
      </button>

      <h1 style={styles.headerTitle}>Detalhes do pedido</h1>

      <CartIconWithBadge onPress={() => navigation('/cart')} />
    </header>
  );

  useEffect(() => {
    if (typeof orderId === 'string') {
      const found = ordersClient.find((o) => o._id === orderId);
      setOrder(found ?? null);
    }
  }, [orderId, ordersClient]);

    const getNumericPrice = (item: CartItem | Product): number => {
      const rawValue = (item as any).product.price ?? (item as any).product.unitPrice;
      return parseFloat(
        String(rawValue)
          .replace(/[^\d,]/g, '') // remove R$, pontos e espaços, mantendo só dígitos e vírgula
          .replace(',', '.') // troca vírgula decimal por ponto
      ) || 0;
    };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);

  if (!order) {
    return (
      <div style={styles.page}>
        {renderHeader()}
        <div style={styles.loadingContainer}>Carregando pedido...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {renderHeader()}

      <div style={styles.scrollContainer}>
        <div style={styles.contentContainer}>
          <h2 style={styles.sectionTitle}>Resumo do Pedido</h2>
          
          <div style={styles.orderInfo}>
            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Número do Pedido:</div>
              <div style={styles.orderValue}>{order.numberOrder}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Data do Pedido:</div>
              <div style={styles.orderValue}>{new Date(order.createdAt!).toLocaleDateString()}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Total de Itens:</div>
              <div style={styles.orderValue}>{order.quantityItems}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Valor Total:</div>
              <div style={styles.orderTotalValue}>{formatCurrency(order.totalPrice)}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Status do pagamento:</div>
              <div style={styles.orderValue}>{order.statusOrder}</div>
            </div>
          </div>

          <h2 style={styles.sectionTitle}>Produtos</h2>

          <div style={styles.productsList}>
            {order.itemsOrder.map((item, index) =>
              typeof item !== 'string' && item && 'product' in item ? (
                <div style={styles.productCard} key={(item as CartItem)._id ?? index}>
                  <img
                    src={`${BASE_URL}/files/image?fileName=${(item as CartItem).product.imagePaths[0]}`}
                    style={styles.productImage as React.CSSProperties}
                    alt={(item as CartItem).product.description ?? 'Produto'}
                  />
                  <div style={styles.productDetails}>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Código:</div>
                      <span style={styles.productCode}>{(item as CartItem).product.code}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Descrição:</div>
                      <div>{(item as CartItem).product.description}</div>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Categoria:</div>
                      <div>{(item as CartItem).product.category.name}</div>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Fornecedor:</div>
                      <div>{(item as CartItem).product.supplier.name}</div>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Preço Unitário:</div>
                      <div style={styles.productPrice}>{(item as CartItem).product.price}</div>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Quantidade Escolhida:</div>
                      <div style={styles.productQuantity}>{(item as CartItem).quantity}</div>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Subtotal:</div>
                      <div style={styles.productTotal}>{formatCurrency(getNumericPrice(item as CartItem) * (item as CartItem).quantity)}</div>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsScreen;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    padding: 20,
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
  },
  // --- HEADER STYLES (Consistente) ---
  header: {
    background: '#000',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '0.5px solid #ddd',
    height: 72,
  },
  backBtn: {
    background: 'transparent',
    border: 0,
    color: '#e799a6',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 600,
  },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#e799a6', margin: 0 },

  // --- CONTENT & LAYOUT ---
  scrollContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0',
    overflowY: 'auto',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 900, // Largura máxima para o conteúdo principal
    margin: '0 20px', // Margem nas laterais
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 15,
    marginTop: 10,
    borderBottom: '2px solid #e799a6',
    paddingBottom: 5,
    color: '#333',
  },
  
  // --- ORDER INFO GRID ---
  orderInfo: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr', // Label e Valor lado a lado
    gap: '8px 15px',
    marginBottom: 20,
    alignItems: 'baseline',
  },
  orderItem: {
    display: 'contents', // Permite que os filhos sejam itens de grid
  },
  orderLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: '#555',
    textAlign: 'right',
    paddingRight: 10,
  },
  orderValue: {
    fontSize: 16,
    fontWeight: 500,
    color: '#333',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e799a6',
  },

  // --- PRODUCTS LIST ---
  productsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 15,
  },
  productCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    display: 'flex',
    gap: 15,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  productImage: {
    width: 120, // Tamanho fixo para a imagem
    height: 120,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
  },
  productDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 15,
    paddingRight: 10,
  },
  detailLabel: {
    fontWeight: 600,
    color: '#666',
  },
  productCode: {
    fontWeight: 700,
    color: '#e799a6',
  },
  productPrice: {
    fontWeight: 600,
    color: '#444',
  },
  productQuantity: {
    fontWeight: 600,
    color: '#444',
  },
  productTotal: {
    fontWeight: 700,
    color: '#e799a6',
  },

  // Estilos antigos removidos/substituídos:
  // container: {},
  // title: {},
  // orderSupplier: {},
  // productSupplier: {},
};