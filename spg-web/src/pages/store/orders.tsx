// src/routes/OrdersScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { MdMenu } from 'react-icons/md';
import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import Menu from '@/components/ui/Menu';
import { useOrder } from '@/contexts/OrderContext';
import type { CartItem, Order } from '@/types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useClient } from '@/contexts/ClientContext';

const OrdersScreen: React.FC = () => {
  const { clients, fetchClients, loggedClient, isAdmin: realAdminUser, logoutClient } = useClient();
  // 2. Capture o parâmetro da URL. 
  // IMPORTANTE: Certifique-se que sua rota no App.tsx esteja definida como "/store/orders/:mode" ou similar
  const { mode } = useParams<{ mode?: string }>();
  const location = useLocation();

  // 3. Crie a lógica de decisão (Architecture Decision):
  // Se "mode" existir na URL, convertemos a string "true"/"false" para boolean.
  // Se não existir (undefined), usamos o padrão do contexto (contextIsAdmin).
  const isViewModeAdmin = useMemo(() => {
      if (mode !== undefined) {
          return mode === 'true';
      }
      return realAdminUser;
  }, [mode, realAdminUser]);

  const { ordersClient, searchOrders } = useOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigate = useNavigate();

  // Header (mantido, pois o estilo está bom)
  const Header = useMemo(
    () => (
      <div
        style={{
          paddingTop: 30,
          height: 96,
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 16,
          borderBottom: '0.5px solid #ddd',
          width: '100%', // Adicionado para garantir 100%
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={() => setMenuVisible((prev) => !prev)}
          style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
          aria-label="Abrir menu"
        >
          <MdMenu size={30} color="white" />
        </button>

        <div style={{ fontSize: 20, fontWeight: 600, color: '#e799a6' }}>Pedidos</div>

        <CartIconWithBadge onPress={() => navigate('/cart')} />
      </div>
    ),
    [navigate]
  );

  // fetch inicial (remova este código SOMENTE após aplicar useCallback em searchOrders no OrderContext)
  // 4. ATUALIZE O EFFECT para usar "isViewModeAdmin" ao invés de "isAdmin" (ou contextIsAdmin)
  useEffect(() => {
    const fetchTokenAndOrders = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log('Modo Admin Ativo:', isViewModeAdmin);
        await searchOrders(token, isViewModeAdmin); 
      } else {
        // 1. Avisa o usuário
        // console.log("📍 URL Completa:", window.location.href);
        // console.log("📍 Rota (Pathname):", location.pathname);
        // console.log("📍 Query Params:", location.search);
        window.alert('Sessão Expirada. Faça login novamente.');
        
        // 2. A MÁGICA: O "-1" significa "Volte 1 página no histórico"
        // Isso joga o usuário de volta exatamente para onde ele estava (Produtos, Home, etc)
        navigate("/");
      }
    };
    fetchTokenAndOrders();
  }, [searchOrders, isViewModeAdmin, navigate]); // Adicionei 'navigate' nas dependências

  // useFocusEffect -> roda quando ordersClient mudar
  useEffect(() => {
    setFilteredOrders([...ordersClient]);
  }, [ordersClient]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      setFilteredOrders(ordersClient);
      return;
    }

    const lower = query.toLowerCase();

    const filtered = ordersClient.filter((order) =>
      // 1. Busca por ID do pedido
      order._id?.toLowerCase().includes(lower) ||
      
      // 2. Busca por Número do pedido
      order.numberOrder.toString().includes(lower) ||
      
      // 3. Busca por Data
      order.createdAt?.toLowerCase().includes(lower) ||
      
      // 4. Busca nos Itens (Produtos)
      order.itemsOrder.some(
        (item) =>
          typeof item !== 'string' &&
          item?.product?.description?.toLowerCase().includes(lower)
      ) ||
      
      // 5. Busca por Preço e Quantidade
      order.totalPrice.toString().includes(lower) ||
      order.quantityItems.toString().includes(lower) ||

      // -------------------------------------------------
      // 🚀 NOVO: BUSCA PELO NOME DO CLIENTE
      // -------------------------------------------------
      (
        typeof order.client !== 'string' && // Verifica se o cliente é um objeto (não apenas ID)
        order.client?.name?.toLowerCase().includes(lower) // Verifica se o nome contem a busca
      )
    );

    setFilteredOrders(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredOrders(ordersClient);
  };


  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'Produtos':
        navigate('/');
        break;
      case 'Minha Conta':
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Meus Pedidos":
        navigate(`/store/orders/${false}`);
        break;
      case 'Pop':
        navigate('/politica-privacidade');
        break;
      case 'Contacts':
        navigate('/contacts');
        break;
      case 'Sobre':
        navigate('/sobre');
        break;
      case 'CadProduct':
        navigate('/cad-product');
        break;
      case 'CadCategory':
        navigate('/cad-category');
        break;
      case 'CadSupplier':
        navigate('/cad-supplier');
        break;
      case 'Pedidos':
        navigate('/store/orders');
        break;
      case 'Clientes':
        navigate('/clientes');
        break;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div style={styles.page}> {/* ALTERADO: Usa styles.page (sem padding lateral) */}
      {Header}               {/* Renderizado FORA do container de conteúdo */}

      <div style={styles.contentWrapper}> {/* NOVO: Aplica o padding lateral APENAS ao conteúdo */}
        {/* Barra de busca */}
        <div style={styles.searchBarContainer}>
          <input
            style={styles.searchBar as React.CSSProperties}
            placeholder="Pesquisar pedidos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button onClick={clearSearch} style={styles.clearButton as React.CSSProperties} aria-label="Limpar busca">
              <span style={styles.clearButtonText}>X</span>
            </button>
          )}
        </div>

        {/* Lista de pedidos */}
        <div>
          {filteredOrders.map((item, index) => (
            <div key={item._id ?? index} style={styles.orderCard}>
              <div style={styles.orderName}>Nº Pedido {item.numberOrder}</div>
              <div style={styles.orderName}>
                Cliente: {
                  // Verifica se é um objeto E se não é nulo
                  typeof item.client !== 'string' && item.client
                    ? item.client.name  // Se for objeto, mostra o e-mail
                    : 'Cliente não carregado (ID apenas)' // Se for string, mostra fallback ou o próprio ID
                }
              </div>
              <div style={styles.orderInStock}>
                Data do pedido: {new Date(item.createdAt!).toLocaleDateString('pt-BR')}
              </div>
              <div style={styles.orderInStock}>
                Itens do pedido:
                {item.itemsOrder
                  .filter(
                    (prod): prod is CartItem =>
                      typeof prod === 'object' &&
                      prod !== null &&
                      'product' in prod &&
                      typeof (prod as any).product?.description === 'string'
                  )
                  .map((p) => `\n - ${p.product.description}`)
                  .join(', ')}
              </div>
              <div style={styles.orderInStock}>Quantidade de produtos: {item.quantityItems}</div>
              <div style={styles.orderInStock}>Total: {formatCurrency(item.totalPrice)}</div>

              <div style={styles.buttonContainer}>
                <button
                  style={styles.buttonBlue as React.CSSProperties}
                  onClick={() => navigate(`/order/${item._id!}`)}
                >
                  <span style={styles.buttonText}>Ver Detalhes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={realAdminUser}
        onProducts={() => handleMenuOption('Produtos')}
        onMinhaConta={() => handleMenuOption('Minha Conta')}
        onPoliticaPrivacidade={() => handleMenuOption('Pop')}
        onMeusPedidos={() => handleMenuOption('Meus Pedidos')}
        // ligue estes quando tiver as rotas:
        onSobre={() => handleMenuOption('Sobre')}
        onContatos={() => handleMenuOption('Contacts')}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadCategory={() => handleMenuOption('CadCategory')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Pedidos')}
        onSair={logoutClient}
        onTermos={() => { /* navigate('/termos'); */ }}
        onAvaliar={() => { /* abrir loja p/ avaliação */ }}
        onPreferencias={() => { /* navigate('/preferencias'); */ }}
        onTutorial={() => { /* navigate('/tutorial'); */ }}
        onAssistenteVirtual={() => { /* navigate('/assistente'); */ }}
      />
    </div>
  );
};

export default OrdersScreen;

const styles: Record<string, React.CSSProperties> = {
  // ALTERADO: Renomeado para 'page' (convenção da home) e removido padding lateral
  page: {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    width: '100%', // Garantido
    boxSizing: 'border-box',
  },
  
  // NOVO: Wrapper para o conteúdo que precisa do padding lateral
  contentWrapper: {
    paddingTop: 10,
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 50,
    flex: 1,
  },
  
  // Os estilos abaixo não foram alterados, mas foram mantidos para contexto
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  // ... (demais estilos omitidos para brevidade, mas devem ser mantidos no seu código)
  menu: {
    position: 'absolute',
    top: 0,
    left: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  menuItem: { paddingTop: 10, paddingBottom: 10, fontSize: 16 },
  searchBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e799a6',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingRight: 6,
  },
  searchBar: {
    flex: 1,
    height: 40,
    paddingInline: 10,
    border: 0,
    outline: 'none',
    background: 'transparent',
  },
  clearButton: { paddingInline: 10, display: 'flex', alignItems: 'center', background: 'transparent', border: 0, cursor: 'pointer' },
  clearButtonText: { fontSize: 18, color: 'gray' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  orderName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  orderInStock: { fontSize: 16, color: '#666', marginBottom: 5 },
  buttonContainer: { marginTop: 10 },
  buttonBlue: {
    backgroundColor: '#e799a6',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    border: 0,
    cursor: 'pointer',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
};