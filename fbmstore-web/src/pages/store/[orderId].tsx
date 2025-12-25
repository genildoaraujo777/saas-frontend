// src/routes/OrderDetailsScreen.tsx
import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import { useOrder } from '@/contexts/OrderContext';
import { CartItem, Order, Product } from '@/types'; 
import React, { useEffect, useState } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';

const OrderDetailsScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { ordersClient } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const navigation = useNavigate();
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // --- HELPERS DE STATUS (Adicionados conforme solicitado) ---
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        'WAITING': 'Aguardando Pagto',
        'PENDING': 'Pendente',
        'IN_PRODUCTION': 'Ativa',
        'DONE': 'Pago / Ativa',
        'CANCELED': 'Cancelada',
        'FAILED': 'Falhou'
    };
    return map[status?.toUpperCase()] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE': 
      case 'SUCCESS':
      case 'PAID':
        return '#10b981'; // Verde
      case 'IN_PRODUCTION':
      case 'APPROVED':
        return '#3b82f6'; // Azul
      case 'WAITING':
      case 'PENDING':
        return '#f59e0b'; // Laranja
      case 'CANCELED':
      case 'FAILED':
        return '#ef4444'; // Vermelho
      default:
        return '#333'; // Padrão
    }
  };
  // ---------------------------------------------------------

  const renderHeader = () => (
    <header style={styles.header}>
            <button
             onClick={() => navigation(-1)}
             style={styles.backBtn}
            >
              Voltar
            </button>
    
            <h1 style={styles.headerTitle}>Detalhes da Assinatura</h1>
    
            <span style={{ width: 30 }} />
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
          .replace(/[^\d,]/g, '') 
          .replace(',', '.') 
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
        <div style={styles.loadingContainer}>Carregando detalhes...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {renderHeader()}

      <div style={styles.scrollContainer}>
        <div style={styles.contentContainer}>
          <h2 style={styles.sectionTitle}>Resumo da Assinatura</h2>
          
          <div style={styles.orderInfo}>
            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Nº da Assinatura:</div>
              <div style={styles.orderValue}>{order.numberOrder}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Data de Criação:</div>
              <div style={styles.orderValue}>{new Date(order.createdAt!).toLocaleDateString()}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Total de Itens:</div>
              <div style={styles.orderValue}>{order.quantityItems}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Valor Mensal:</div>
              <div style={styles.orderTotalValue}>{formatCurrency(order.totalPrice)}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Status Atual:</div>
              {/* USO DA FUNÇÃO DE STATUS E COR AQUI */}
              <div style={{
                  ...styles.orderValue, 
                  color: getStatusColor(order.statusOrder),
                  fontWeight: '800'
              }}>
                  {getStatusLabel(order.statusOrder)}
              </div>
            </div>
          </div>

          <h2 style={styles.sectionTitle}>Plano Selecionado</h2>

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
                      <div style={styles.detailLabel}>Plano:</div>
                      <span style={styles.productCode}>{(item as CartItem).product.code || (item as CartItem).product.name}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Descrição:</div>
                      <div>{(item as CartItem).product.description}</div>
                    </div>
                    {/* Categoria/Fornecedor ocultados se não relevantes para SaaS, ou mantenha se quiser */}
                    
                    <div style={styles.detailRow}>
                      <div style={styles.detailLabel}>Valor Mensal:</div>
                      <div style={styles.productPrice}>{formatCurrency(getNumericPrice(item as CartItem))}</div>
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
    fontFamily: 'Inter, sans-serif',
  },
  loadingContainer: {
    padding: 20,
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
  },
  header: {
    background: "#0f172a", 
    color: "#fff",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 as const, color: "#fff", margin: 0, letterSpacing: '0.5px' },
  backBtn: {
    background: 'transparent',
    border: 0,
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 600,
  },
  scrollContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0',
    overflowY: 'auto',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 900, 
    margin: '0 20px', 
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
    borderBottom: '2px solid #4f46e5',
    paddingBottom: 5,
    color: '#333',
  },
  orderInfo: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr', 
    gap: '12px 20px',
    marginBottom: 30,
    alignItems: 'baseline',
  },
  orderItem: {
    display: 'contents', 
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
    color: '#4f46e5',
  },
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
    alignItems: 'flex-start',
  },
  productImage: {
    width: 100, 
    height: 100,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid #eee'
  },
  productDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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
    color: '#4f46e5',
  },
  productPrice: {
    fontWeight: 700,
    color: '#333',
  },
  productQuantity: {
    fontWeight: 600,
    color: '#444',
  },
  productTotal: {
    fontWeight: 700,
    color: '#4f46e5',
  },
};