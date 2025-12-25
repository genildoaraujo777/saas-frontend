import React, { useEffect, useMemo, useState } from 'react';
import { MdMenu, MdRefresh } from 'react-icons/md';
import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import Menu from '@/components/ui/Menu';
import { useOrder } from '@/contexts/OrderContext';
import type { Order } from '@/types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';
import api from '@/services/api'; // Importação direta da API para o update

const OrdersScreen: React.FC = () => {
  const { clients, fetchClients, loggedClient, isAdmin: realAdminUser, logoutClient } = useClient();
  const { mode } = useParams<{ mode?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isViewModeAdmin = useMemo(() => {
      if (mode !== undefined) {
          return mode === 'true';
      }
      return realAdminUser;
  }, [mode, realAdminUser]);

  const { ordersClient, searchOrders } = useOrder();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper para cores de status
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE': 
      case 'SUCCESS':
      case 'PAID':
        return '#10b981'; // Verde Sucesso
      case 'IN_PRODUCTION':
      case 'APPROVED':
        return '#3b82f6'; // Azul
      case 'WAITING':
      case 'PENDING':
        return '#f59e0b'; // Laranja/Amarelo
      case 'CANCELED':
      case 'FAILED':
        return '#ef4444'; // Vermelho
      default:
        return '#6b7280'; // Cinza
    }
  };

  // Helper para tradução de status
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

  // Carrega assinaturas
  const loadOrders = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await searchOrders(token, isViewModeAdmin);
        }
    } catch (error) {
        console.error("Erro ao buscar assinaturas", error);
    } finally {
        setLoading(false);
    }
  };

  // 1. Efeito Inicial
  useEffect(() => {
    loadOrders();
  }, [isViewModeAdmin]);

  // 2. Efeito para Detectar Retorno do Stripe
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status');
    const orderIdParam = queryParams.get('order');

    if (statusParam === 'success') {
        // 🛑 REMOVA A CHAMADA api.patch DAQUI! 🛑
        // O Webhook já está fazendo isso no servidor.

        // Apenas mostre uma mensagem bonita para o usuário
        // alert("Pagamento processado! Atualizando lista..."); 

        // Força o recarregamento para pegar o status novo que o Webhook acabou de gravar
        // Nota: Pode haver um delay de 1 a 3 segundos entre o Stripe confirmar e o Webhook bater no seu server.
        // Se ao carregar ainda estiver "PENDING", o usuário pode clicar no botão de refresh depois.
        setTimeout(() => {
            loadOrders(); 
        }, 2000); // Um pequeno delay ajuda a dar tempo do Webhook chegar

        // Limpa a URL
        navigate(location.pathname, { replace: true });

    } else if (statusParam === 'cancel') {
        alert("O processo de assinatura foi cancelado.");
        navigate(location.pathname, { replace: true });
    }
  }, [location.search]);


  // Filtro local
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return ordersClient;
    const lower = searchQuery.toLowerCase();
    return ordersClient.filter(o => 
        String(o.numberOrder).includes(lower) || 
        o.statusOrder?.toLowerCase().includes(lower)
    );
  }, [ordersClient, searchQuery]);

  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case "Minha Conta":
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Produtos": // Pode renomear para "Planos" se quiser
        navigate("/"); 
        break;
      case "Sair":
        logoutClient();
        navigate("/login");
        break;
      default:
        break;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => setMenuVisible(!menuVisible)} style={styles.iconButton}>
          <MdMenu size={28} color="#fff" />
        </button>
        <h1 style={styles.headerTitle}>{isViewModeAdmin ? 'Gestão de Assinaturas' : 'Minhas Assinaturas'}</h1>
        <CartIconWithBadge onPress={() => navigate('/cart')} />
      </header>

      <div style={styles.content}>
        {/* Barra de Busca e Refresh */}
        <div style={styles.toolsBar}>
            <div style={styles.searchBarContainer}>
                <span style={{ paddingLeft: 10 }}>🔍</span>
                <input 
                    style={styles.searchBar} 
                    placeholder="Buscar assinatura..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button onClick={loadOrders} style={styles.refreshButton} title="Atualizar Lista">
                <MdRefresh size={24} color="#4f46e5" />
            </button>
        </div>

        {/* Lista de Assinaturas */}
        {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Carregando assinaturas...</div>
        ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Nenhuma assinatura encontrada.</div>
        ) : (
            <div style={styles.listContainer}>
                {filteredOrders.map((order) => (
                    <div 
                        key={order._id || order.numberOrder} 
                        style={styles.card}
                        onClick={() => navigate(`/order/${order._id}`)} // Detalhes
                    >
                        <div style={styles.cardHeader}>
                            {/* ALTERADO: Texto "Assinatura" */}
                            <span style={styles.orderNumber}>Assinatura #{order.numberOrder}</span>
                            <span style={styles.orderDate}>
                                {new Date(order.createdAt!!).toLocaleDateString('pt-BR')}
                            </span>
                        </div>

                        <div style={styles.cardBody}>
                            <div style={styles.infoRow}>
                                <span>Status:</span>
                                {/* Cor dinâmica aplicada aqui */}
                                <span style={{
                                    ...styles.orderStatus, 
                                    color: getStatusColor(order.statusOrder) 
                                }}>
                                    {getStatusLabel(order.statusOrder)}
                                </span>
                            </div>
                            
                            <div style={styles.infoRow}>
                                <span>Plano/Itens:</span>
                                <span>{order.quantityItems}</span>
                            </div>

                            <div style={styles.totalRow}>
                                <span>Mensalidade:</span>
                                <span style={styles.totalValue}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalPrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userAdmin={realAdminUser}
        onMinhaConta={() => handleMenuOption("Minha Conta")}
        onProducts={() => handleMenuOption("Produtos")}
        onSair={() => handleMenuOption("Sair")}
        userDoc="" onPoliticaPrivacidade={()=>{}} onMinhasAssinaturas={()=>{}} onSobre={()=>{}} onContatos={()=>{}} onCadProduct={()=>{}} onCadCategory={()=>{}} onCadSupplier={()=>{}} onAllClients={()=>{}} onAllOrders={()=>{}} onTermos={()=>{}} onAvaliar={()=>{}} onPreferencias={()=>{}} onTutorial={()=>{}} onAssistenteVirtual={()=>{}} onFinanLito={()=>{}}
      />
    </div>
  );
};

export default OrdersScreen;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    backgroundColor: '#0f172a',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 0,
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  toolsBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  },
  searchBarContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  searchBar: {
    flex: 1,
    border: 'none',
    padding: '10px',
    outline: 'none',
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '0 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderNumber: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderDate: {
    color: '#6b7280',
    fontSize: 14,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#4b5563',
  },
  
  // ESTILO BASE (A cor é sobrescrita dinamicamente)
  orderStatus: { 
    fontSize: 14, 
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 8,
    borderTop: '1px dashed #e5e7eb',
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    color: '#4f46e5', // Indigo
    fontSize: 16,
  },
};