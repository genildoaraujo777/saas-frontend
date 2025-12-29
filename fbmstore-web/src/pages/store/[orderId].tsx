// src/routes/OrderDetailsScreen.tsx
import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import { useOrder } from '@/contexts/OrderContext';
import { CartItem, Order, Product } from '@/types'; 
import React, { useEffect, useState } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';
import { MdCancel, MdEventBusy, MdCheckCircle, MdAutorenew } from 'react-icons/md';
import api from '@/services/api';

const OrderDetailsScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { ordersClient } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const navigation = useNavigate();
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Lógica de Estado da Assinatura
  const isCancelScheduled = (order as any)?.cancelAtPeriodEnd === true;
  const isFullyCanceled = order?.statusOrder?.toUpperCase() === 'CANCELED';
  const isActiveStatus = order && ['DONE', 'PAID', 'SUCCESS', 'ACTIVE'].includes(order.statusOrder?.toUpperCase());
  
  // Deve mostrar o botão? (Sim, se estiver ativo ou agendado para cancelar)
  const showButton = isActiveStatus || isCancelScheduled; 
  // Deve estar desabilitado? (Sim, se já estiver cancelado totalmente)
  // Obs: Se for agendado (isCancelScheduled), ele FICA HABILITADO, mas verde para reativar.
  const isButtonDisabled = isFullyCanceled;

  // Função Cancelar Local
  const handleCancelOrder = async () => {
    if(!order) return;
    if(!confirm("Deseja cancelar esta assinatura? O acesso continuará até o fim do período pago.")) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await api.post('/pagto/subscription/cancel', { orderId: order._id }, { headers: { Authorization: `Bearer ${token}` } });
        
        // Exibe data correta vinda do backend
        const serverDate = response.data?.expirationDate;
        if(serverDate){
             alert(`Cancelamento agendado.\nDisponível até: ${new Date(serverDate).toLocaleDateString('pt-BR')}`);
        } else {
             alert("Solicitação enviada. A assinatura será cancelada ao final do período.");
        }
        
        navigation(0); 
    } catch (err) { alert("Erro ao cancelar."); }
  };

  // Função Reativar Local
  const handleReactivateOrder = async () => {
    if(!order) return;
    if(!confirm("Deseja desfazer o cancelamento e manter a assinatura ativa?")) return;
    
    try {
        const token = localStorage.getItem('token');
        await api.post('/pagto/subscription/reactivate', { orderId: order._id }, { headers: { Authorization: `Bearer ${token}` } });
        alert("Assinatura reativada com sucesso! O cancelamento foi removido.");
        navigation(0); 
    } catch (err) { alert("Erro ao reativar."); }
  };

  const clientName = (order && typeof order.client === 'object') ? (order.client as any).name : '---';

  // --- HELPERS DE STATUS ---
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        'WAITING': 'Aguardando Pagto',
        'PENDING': 'Pendente',
        'IN_PRODUCTION': 'Ativa',
        'DONE': 'Pago / Ativa',
        'ACTIVE': 'Ativa',
        'CANCELED': 'Cancelada',
        'FAILED': 'Falhou'
    };
    return map[status?.toUpperCase()] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE': 
      case 'ACTIVE': 
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

            {/* MOSTRAR CLIENTE */}
            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Cliente:</div>
              <div style={styles.orderValue}>{clientName}</div>
            </div>

            <div style={styles.orderItem}>
              <div style={styles.orderLabel}>Status Atual:</div>
              <div style={{
                  ...styles.orderValue, 
                  color: getStatusColor(order.statusOrder),
                  fontWeight: '800'
              }}>
                  {getStatusLabel(order.statusOrder)}
              </div>
            </div>
          </div>

          {/* --- NOVO: AVISO DE VALIDADE SE ESTIVER CANCELADO/AGENDADO --- */}
          {(isCancelScheduled || isFullyCanceled) && (order as any).currentPeriodEnd && (
                <div style={styles.alertBox}>
                    <MdEventBusy size={20} />
                    <div>
                        <strong>Assinatura Cancelada/Agendada</strong><br/>
                        Seu acesso aos recursos Premium continuará ativo até: <br/>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                            {new Date((order as any).currentPeriodEnd).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
            )}
            {/* ----------------------------------------------------------- */}

          {/* BOTÃO INTELIGENTE: CANCELAR, REATIVAR OU INATIVO */}
          {showButton && (
             <button 
                onClick={isCancelScheduled ? handleReactivateOrder : handleCancelOrder} 
                disabled={isButtonDisabled}
                style={{
                    ...styles.cancelBtnLarge,
                    // CORES DINÂMICAS:
                    // 1. Reativar (Verde)
                    // 2. Inativo (Cinza)
                    // 3. Cancelar (Vermelho)
                    backgroundColor: isCancelScheduled ? '#10b981' : (isButtonDisabled ? '#f3f4f6' : '#fee2e2'),
                    color: isCancelScheduled ? '#fff' : (isButtonDisabled ? '#9ca3af' : '#dc2626'),
                    borderColor: isCancelScheduled ? '#059669' : (isButtonDisabled ? '#e5e7eb' : '#fca5a5'),
                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                }}
             >
                {isCancelScheduled ? (
                    <>
                         <MdAutorenew size={20} /> Reativar Assinatura (Desistir)
                    </>
                ) : isButtonDisabled ? (
                    <>
                        <MdCancel size={20} /> Assinatura Inativa
                    </>
                ) : (
                    <>
                        <MdCancel size={20} /> Cancelar Assinatura Agora
                    </>
                )}
             </button>
          )}

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
    boxSizing: 'border-box', overflowX: 'hidden'
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
    width: '95%',
    maxWidth: 900, 
    margin: '0 auto',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
    boxSizing: 'border-box'
  },
  cancelBtnLarge: {
      width: '100%', padding: '15px', marginBottom: '20px', 
      border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
      fontSize: '1rem', transition: 'all 0.2s ease'
  },
  alertBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff7ed', // Laranja Claro
    color: '#c2410c', // Laranja Escuro
    borderRadius: 8,
    border: '1px solid #ffedd5',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    lineHeight: '1.5'
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