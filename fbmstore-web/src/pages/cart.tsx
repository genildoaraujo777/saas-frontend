// src/routes/CartScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { MdMenu } from 'react-icons/md';
import { FaTrashAlt, FaPlus, FaMinus } from 'react-icons/fa'; // Importando ícones para melhor estética

import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import Menu from '@/components/ui/Menu';

import { useCart } from '@/contexts/CartContext';
import { useModal } from '@/contexts/ModalContext';
import { useOrder } from '@/contexts/OrderContext';
import { useStock } from '@/contexts/StockContext';

import type { CartItem, Product } from '@/types';
import { useNavigate } from 'react-router-dom';
import { checkTokenValidity, searchAccountData } from '@/services/AuthenticationService';
import { useClient } from '@/contexts/ClientContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

const CartScreen: React.FC = () => {
  const { hasActiveFinance } = useSubscriptionCheck();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCart();
  const { stockItems, updateStock, fetchStockItemsByQuery } = useStock();
  const { createOrder, searchOrders } = useOrder();
  const { showModal, updateModal, hideModal } = useModal();

  const [menuVisible, setMenuVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<CartItem[]>([]);
  const [noFetchMore, setNoFetchMore] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [menuCategoryVisible, setMenuCategoryVisible] = useState(false);
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigation = useNavigate();

  // Header (equivalente ao header custom do RN)
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
        }}
      >
        <button
          onClick={() => setMenuVisible((prev) => !prev)}
          style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
          aria-label="Abrir menu"
        >
          <MdMenu size={30} color="white" />
        </button>

        <div style={{ fontSize: 20, fontWeight: 600, color: '#e799a6' }}>Carrinho</div>

        <CartIconWithBadge onPress={() => navigation('/cart')} />
      </div>
    ),
    [navigation]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);

  /**
   * Função auxiliar para converter a string de preço (ex: "R$ 1.111,11") para um número.
   * Isso garante que formatCurrency não quebre caso receba uma string.
   */
  const getNumericPrice = (item: CartItem | Product): number => {
    const rawValue = (item as any).price ?? (item as any).unitPrice;
    return parseFloat(
      String(rawValue)
        .replace(/[^\d,]/g, '') // remove R$, pontos e espaços, mantendo só dígitos e vírgula
        .replace(',', '.') // troca vírgula decimal por ponto
    ) || 0;
  };


  const handleRemoveFromCart = (productItem: Product) => {
    removeFromCart(productItem._id!!);
  };

  const handleDecreaseQuantity = (productItem: Product) => {
    decreaseQuantity(productItem._id!!);
  };

  const handleIncreaseQuantity = (product: Product) => {
    const cartItem = cartItems.find((item) => item._id === product._id);
    const stockItem = stockItems.find((item) => item._id === product._id);

    const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
    const totalQuantity = currentQuantityInCart + 1;

    if (stockItem && totalQuantity > stockItem.quantityStock) {
      window.alert(
        `Estoque Insuficiente\nA quantidade disponível para o produto "${product.code}" é ${product.quantityStock}.`
      );
    } else {
      increaseQuantity(product._id!!);
    }
  };

  // Calcula o valor total do pedido
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + getNumericPrice(item) * item.quantity;
  }, 0);

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      navigation('/login', { replace: true });
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'Produtos':
        window.location.href = '/';
        break;
      case 'Minha Conta':
        navigation(`/store/account/${loggedClient?.client._id}`);
        break;
      case 'Minhas Assinaturas':
        navigation(`/store/orders/${false}`);
        break;
      case 'Pop':
        navigation('/politica-privacidade');
        break;
      case 'Contacts':
        navigation('/contacts');
        break;
      case 'Sobre':
        navigation('/sobre');
        break;
      case 'CadProduct':
        navigation('/cad-product');
        break;
      case 'CadCategory':
        navigation('/cad-category');
        break;
      case 'CadSupplier':
        navigation('/cad-supplier');
        break;
      case 'Assinaturas':
        navigation('/pedidos');
        break;
      case 'Clientes':
        navigation('/clientes');
        break;
      case 'Controle Financeiro':
        navigation('/finanlito');
        break;
      default:
        handleProductsByCategory(option);
        break;
    }
  };

  const handleProductsByCategory = async (categoryIdParam: string) => {
    const filtered = await fetchStockItemsByQuery('', categoryIdParam, '');
    setFilteredProducts(filtered);
    setNoFetchMore(false);
    setCategoryId(categoryIdParam);
    setMenuCategoryVisible(false);
  };

  const truncateDescription = (description: string) => {
          return description.slice(0, 23) + '...';
      };

  

  // Função para finalizar o pedido (sem formas de pagamento)
  const handleCheckout = async () => {
    const isAuth = async () => {
      // CORREÇÃO: Pegar o token do localStorage para verificar se está logado
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Sessão expirou, por favor entre novamente.");
        navigation('/login', { replace: true }); 
              return false;
      }
      const retorno = await checkTokenValidity(token);
      // Se checkTokenValidity retorna true (expirado)
      if (!retorno) {
        alert("Sessão expirou, por favor entre novamente.");
        navigation('/login', { replace: true }); 
        return false;
      }
      return true; // Token válido
    };
    
    if (await isAuth()) {
        // Agora, navega para a nova tela de checkout
        // navigation('/checkout');
        const tokendois = localStorage.getItem('token');
        createLocalOrder(tokendois!!, "APROVADO")
    }
  };

  const createLocalOrder = async (tokenAuth: string, paymentStatus: string) => {
          let totalOrderItems = 0;
  
          const itemsOrderForContext = cartItems.map((item: CartItem) => { 
              updateStock(item._id!!, -item.quantity); 
              totalOrderItems += item.quantity;
              return item; 
          });
          // console.log('orderstokenisadmin: ',tokenAuth, isAdmin)
  
          const orders = await searchOrders(tokenAuth, isAdmin);
          // console.log('orders: ',orders)
          const lastOrder = orders.length > 0 ? orders[0] : undefined;
  
          const clientID = loggedClient?.client?._id;
  
          const newOrder = {
              numberOrder: (lastOrder?.numberOrder ?? 0) + 1,
              createdAt: new Date().toISOString(),
              itemsOrder: itemsOrderForContext, 
              totalPrice: totalPrice,
              quantityItems: totalOrderItems,
              statusOrder: paymentStatus, 
              client: clientID,
          };
  
          await createOrder(newOrder, tokenAuth);
      }

  return (
    <div style={styles.page}> {/* Wrapper de página */}
      {Header}

      {cartItems.length === 0 ? (
        <div style={styles.emptyCartMessage}>O carrinho está vazio.</div>
      ) : (
        <div style={styles.mainContent}> {/* Wrapper principal para o conteúdo responsivo */}
          <div style={styles.productsGrid}> {/* Aplicação do CSS Grid */}
            {cartItems.map((item) => (
              <div
                key={item._id!!}
                // Aplicando o novo estilo de card responsivo (cartCard)
                style={{
                  ...styles.cartCard, // NOVO ESTILO (Base Flex/Responsivo)
                  ...(item.quantityStock === 0 ? styles.outOfStockCard : null),
                  ...(item.quantityStock && item.quantityStock <= 3 ? styles.lowStockCard : null),
                }}
              >
                {/* ⬅️ ÁREA DA IMAGEM (COLUNA ESQUERDA) */}
                <div style={styles.itemImageArea}> 
                  <img
                    src={`${BASE_URL}/files/image?fileName=${item.imagePaths[0]}`}
                    style={styles.cartItemImage as React.CSSProperties} // Estilo de imagem ajustado
                    alt={item.description ?? 'Produto'}
                  />
                </div>
                
                {/* ➡️ ÁREA DE INFORMAÇÕES (COLUNA DIREITA) */}
                <div style={styles.itemInfoArea}> 
                  
                  {/* Informações do Produto */}
                  <div style={styles.productDetails}>
                    <div style={styles.productSupplier}>
                      <span style={{fontWeight: 600}}>Código:</span> <span style={styles.productCode}>{item.code}</span>
                    </div>
                    <div style={styles.productSupplier}>
                      <span style={{fontWeight: 600}}>Descrição:</span> {item.description.length >= 23 ? truncateDescription(item.description) : item.description}
                    </div>
                    <div style={styles.productSupplier}>
                      <span style={{fontWeight: 600}}>Fornecedor:</span> {item.supplier.name}
                    </div>
                    
                    {/* Preço e Quantidade */}
                    <div style={styles.priceAndQuantity}>
                      <div style={styles.productSupplier}>
                        <span style={{fontWeight: 600}}>Preço Unitário:</span> <span style={styles.productPrice}>{formatCurrency(getNumericPrice(item))}</span>
                      </div>
                      <div style={{...styles.productQuantity, fontWeight: 700}}>
                        Quantidade no Carrinho: <span style={{color: '#000'}}>{item.quantity || 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  {/* 🚀 LÓGICA DE BOTÕES CORRIGIDA */}
                  <div style={styles.buttonContainer}>
                    <button style={styles.button as React.CSSProperties} onClick={() => handleRemoveFromCart(item)}>
                      <span style={styles.buttonText}>Remover</span>
                      <FaTrashAlt size={14} color="white" style={{ marginLeft: 5 }} />
                    </button>
                    <button style={styles.buttonPinkControl as React.CSSProperties} onClick={() => handleIncreaseQuantity(item)}>
                      <FaPlus size={14} color="white" />
                    </button>
                    <button
                      style={styles.buttonPinkControl as React.CSSProperties}
                      onClick={() => handleDecreaseQuantity(item)}
                      disabled={item.quantity === 1}
                    >
                      <FaMinus size={14} color="white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

       {/* Footer Fixo */}
      {cartItems.length > 0 && (
        <div style={styles.footer}>
          <div style={styles.footerContent}> 
            <div style={styles.totalPrice}>Total: {formatCurrency(totalPrice)}</div>
            <div style={styles.footerButtons}> 
                <button style={styles.buttonPinkLarge as React.CSSProperties} onClick={handleCheckout}>
                    <span style={styles.buttonText}>Finalizar Pedido</span>
                </button>
                <button style={styles.buttonBlueLarge as React.CSSProperties} onClick={() => handleMenuOption('Produtos')}>
                    <span style={styles.buttonText}>Adicionar mais itens</span>
                </button>
            </div>
          </div>
        </div>
      )}

      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        hasFinancialAccess={hasActiveFinance}
        onProducts={() => handleMenuOption('Produtos')}
        onMinhaConta={() => handleMenuOption('Minha Conta')}
        onPoliticaPrivacidade={() => handleMenuOption('Pop')}
        onMinhasAssinaturas={() => handleMenuOption('Minhas Assinaturas')}
        onSobre={() => handleMenuOption('Sobre')}
        onContatos={() => handleMenuOption('Contacts')}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadCategory={() => handleMenuOption('CadCategory')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Assinaturas')}
        onSair={logoutClient}
        onTermos={() => {}}
        onAvaliar={() => {}}
        onPreferencias={() => {}}
        onTutorial={() => {}}
        onAssistenteVirtual={() => {}}
        onFinanLito={() => handleMenuOption('Controle Financeiro')}
      />
    </div>
  );
};

export default CartScreen;

const styles: Record<string, React.CSSProperties> = {
  // 🆕 Novo Wrapper de Página
  page: {
    minHeight: '100vh',
    background: '#f5f5f5', // Fundo cinza para contraste
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box',
  },
  // 1. 🚀 MAIN CONTENT AJUSTADO
  mainContent: {
    width: '100%',
    maxWidth: 1000, // 💡 Reduz o MAX WIDTH do conteúdo principal (ajusta o card único)
    margin: '0 auto', // Centraliza o bloco principal na tela grande
    padding: '20px', 
    paddingBottom: 100, 
    flex: 1, 
    boxSizing: 'border-box' as const,
  },
  // 🆕 Novo Estilo de Grid (Responsivo, como em home.tsx)
  productsGrid: {
    display: 'grid',
    // Configura colunas: no mínimo 300px, e se tiver espaço, distribui igualmente (1fr)
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20, // Espaçamento entre os cards
    width: '100%',
  },
  // ⭐️⭐️ NOVO ESTILO PARA O CARD DO CARRINHO (RESPONSIVO COMO HOME.TSX) ⭐️⭐️
  cartCard: { // Substitui o antigo productCard
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box' as const,
    // ESTILOS FLEX
    display: 'flex', 
    flexDirection: 'row' as const, 
    flexWrap: 'wrap' as const, // Permite empilhamento em mobile
    gap: 15, 
  },
  // 3.1. Área da Imagem (Coluna Esquerda) - Copiado de home.tsx
  itemImageArea: {
    flex: '1 1 150px', // Cresce (1), Encolhe (1), Base de 150px.
    maxWidth: 150, // Limite o tamanho no desktop
    minWidth: 100,
    width: '100%', // No modo wrap, ocupa 100%
    textAlign: 'center' as const, // Centraliza a imagem
    margin: '0 auto', // Centraliza o próprio contêiner
  },
  // Imagem do Item (Ajustado o nome e objectFit)
  cartItemImage: { 
    width: "100%", 
    height: 150, 
    objectFit: "contain" as const, // Melhor para visualização do produto
    borderRadius: 8, 
    marginBottom: 5,
    border: '1px solid #ddd',
  },
  // 3.2. Área de Informações (Coluna Direita) - Copiado de home.tsx
  itemInfoArea: {
    flex: '1 1 auto', 
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between', // Alinha conteúdo e botões
    minWidth: 180, // Garante que a coluna não fique muito pequena
  },
  // Container de detalhes para empurrar os botões para baixo
  productDetails: {
    marginBottom: 10,
  },
  // Container para Preço e Quantidade (Melhora o espaçamento)
  priceAndQuantity: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #eee',
  },
  // Mensagem de carrinho vazio
  emptyCartMessage: {
    textAlign: 'center' as const,
    padding: '50px 20px',
    fontSize: 20,
    color: '#666',
    flex: 1,
  },
 // Footer Styles
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTop: '1px solid #ddd',
    zIndex: 10,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    display: 'flex', // Adiciona flex para centralizar o conteúdo interno
    justifyContent: 'center' as const, // Centraliza o footerContent
    padding: 10, // Padding vertical menor para não ocupar tanto espaço
  },
    // 2. 🚀 NOVO CONTAINER PARA CENTRALIZAR O CONTEÚDO DO FOOTER
  footerContent: {
      width: '100%',
      maxWidth: 1000, // 💡 Ocupa no máximo 1000px de largura
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 10px', // Padding interno
  },
   footerButtons: {
      display: 'flex',
      gap: 10, // Espaçamento entre os botões
      flexWrap: 'wrap' as const, // Permite que os botões quebrem em mobile
      justifyContent: 'flex-end' as const, // Alinha os botões à direita em desktop
      flex: 1, // Permite que a área de botões ocupe o espaço restante
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 0, // Impede que o total encolha
  },
  outOfStockCard: {
    opacity: 0.5,
  },
  lowStockCard: {
    borderWidth: 2,
    borderColor: 'orange',
    borderStyle: 'solid',
  },
  
  // 💡 NOVO ESTILO: Container para os botões dentro do card.
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start', // Alinha ao início
    alignItems: 'center',
    gap: 8, 
    marginTop: 10,
    flexWrap: 'wrap' as const,
    // 💡 Ajuste para dar prioridade ao Remover e agrupar os controles (+/-)
  },
  
  // Botão de Remover (Vermelho) - Agora não domina o espaço
  button: {
    backgroundColor: '#FF0000',
    color: '#FFFFFF', // Cor do texto/ícone
    padding: 10,
    borderRadius: 5,
    border: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0, // NÂO cresce
    minWidth: 100, // Largura fixa para "Remover"
    fontWeight: 'bold',
  },
  
  // 🚀 NOVO ESTILO: Botões de Controle (+/-)
  buttonPinkControl: {
    backgroundColor: '#e799a6',
    padding: 10, // Padding decente
    borderRadius: 5,
    border: 0,
    cursor: 'pointer',
    flex: 0, // NÂO cresce
    width: 38, // Largura fixa menor
    height: 38, // Altura igual à largura
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Botões Grandes (Para o Footer)
  buttonBlueLarge: { // Adicionar Mais Itens (usando 'green' como no código anterior)
    backgroundColor: 'green',
    padding: '12px 15px',
    borderRadius: 5,
    border: 0,
    cursor: 'pointer',
    fontWeight: 'bold',
    flex: 1, // Em mobile, cresce
    maxWidth: 200, // 💡 Limita o tamanho em desktop
  },
  buttonPinkLarge: { // Finalizar Pedido
    backgroundColor: '#e799a6',
    padding: '12px 15px',
    borderRadius: 5,
    border: 0,
    cursor: 'pointer',
    fontWeight: 'bold',
    flex: 1, // Em mobile, cresce
    maxWidth: 200, // 💡 Limita o tamanho em desktop
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14, 
    fontWeight: 'bold',
  },
  
  // Ajustes de Tipografia
  productCode: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
    color: '#e799a6', 
    fontWeight: 'bold',
  },
  productQuantity: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  productSupplier: {
    fontSize: 14, // Reduzido levemente
    marginBottom: 5,
  },
  // Estilos de Menu (Inalterados)
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
  menuItem: {
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: 'black',
  },
  submenu: {
    position: 'absolute',
    top: 50,
    left: 150,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  submenuItem: {
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: 'black',
  },
};