import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Menu from "@/components/ui/Menu";
import { useCart } from "@/contexts/CartContext";
import { useCategory } from "@/contexts/CategoryContext";
import { useStock } from "@/contexts/StockContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { CartItem } from "@/types";
import { MdMenu, MdRocketLaunch, MdLogin } from "react-icons/md"; // Adicionei MdLogin para o ícone de acesso
import { useClient } from "@/contexts/ClientContext";
import { useOrder } from "@/contexts/OrderContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

const HomePage: React.FC = () => {
  const { hasActiveFinance } = useSubscriptionCheck();
  const navigate = useNavigate();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();

  // 1. IMPORTANTE: Pegamos 'ordersClient' aqui para checar as assinaturas
  const { searchOrders, ordersClient } = useOrder(); 

  const { cartItems } = useCart();
  const { categoriesItems } = useCategory();
  const { suppliersItems } = useSupplier();
  const { stockItems, fetchMoreProducts, fetchStockItemsByQuery, notIsLoading, isLoading } = useStock();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<CartItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [noFetchMore, setNoFetchMore] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const memoizedProducts = useMemo(() => {
    return stockItems;
  }, [stockItems]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && loggedClient) {
        searchOrders(token, isAdmin).catch(err => 
            console.error("Erro ao verificar assinaturas em background:", err)
        );
    }
  }, [loggedClient, isAdmin]);

  useEffect(() => {
    if (!searchQuery) setFilteredProducts(memoizedProducts);
  }, [memoizedProducts, searchQuery]);

  useEffect(() => {
    if (searchQuery === "") {
      handleSearch();
      setNoFetchMore(true);
    } else {
      setNoFetchMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchText = (q: string) => {
    setSearchQuery(q);
    setIsSearching(false);
  };

  const handleSearch = async () => {
    if (searchQuery) {
      setIsSearching(true);
      try {
        const filtered = await fetchStockItemsByQuery(searchQuery, categoryId, supplierId);
        setFilteredProducts(filtered);
        setIsSearchActive(true);
      } catch(error) {
         console.error("Erro na busca:", error);
      }
      setIsSearching(false);
    } else {
      setFilteredProducts(memoizedProducts);
      setIsSearchActive(false); 
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setIsSearchActive(false);
  };

  const handleMenuOption = (option: string) => {
    switch (option) {
      case 'Produtos':
        window.location.href = '/';
        break;
      case "Minha Conta":
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Minhas Assinaturas":
        navigate(`/store/orders/${false}`);
        break;
      case "Pop":
        navigate('/politica-privacidade');
        break;
      case "Contacts":
        navigate("/contacts");
        break;
      case "Sobre":
        navigate("/sobre");
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
      case 'Assinaturas':
        navigate(`/store/orders/${isAdmin}`);
        break;
      case 'Clientes':
        navigate('/clientes');
        break;
      case 'Controle Financeiro':
        navigate('/finanlito');
        break;
      case 'Gerador de OSs':
        navigate('/os-editor');
        break;
      default:
        handleProductsByCategory(option);
        break;
    }
  };

  const handleProductsByCategory = async (categoryIdParam: string) => {
    const filtered = await fetchStockItemsByQuery("", categoryIdParam, "");
    setFilteredProducts(filtered);
    setNoFetchMore(false);
    setCategoryId(categoryIdParam);
  };

  const loadMoreProducts = () => {
    if (!isLoading && !notIsLoading) fetchMoreProducts();
  };

  // --- INTERFACE DO ITEM ---
  interface ItemProps {
    product: CartItem;
    itemIndex: number;
    // 2. Adicionamos a lista de pedidos nas props
    ordersClient?: any[];
  }

  const ItemComponent = React.memo(
    ({ product, itemIndex, ordersClient }: ItemProps) => {
      
      const truncateDescription = (description: string) => {
          return description.length > 50 ? description.slice(0, 50) + '...' : description;
      };

      // 3. LÓGICA DE VERIFICAÇÃO DE ASSINATURA ATIVA
      const hasActiveSubscription = useMemo(() => {
        if (!ordersClient) return false;

        return ordersClient.some(order => {
            const status = order.statusOrder?.toUpperCase();
            // Status que consideram acesso liberado
            const hasAccess = ['DONE', 'PAID', 'SUCCESS', 'ACTIVE', 'TRIALING'].includes(status);
            if (!hasAccess) return false;

            // Verifica se este produto está dentro do pedido
            return order.itemsOrder.some((item: any) => {
                const itemId = typeof item === 'string' ? item : item.product?._id || item._id;
                // Compara IDs ou Códigos se houver
                if (itemId === product._id) return true;
                if (product.code && typeof item !== 'string' && item.product?.code === product.code) return true;
                return false;
            });
        });
      }, [ordersClient, product]);

      // 4. LÓGICA DE ROTA (Acessar Produto vs Assinar)
      let buttonText = product.quantityStock === 0 ? "Indisponível" : "Ver Detalhes";
      let buttonLink = `/subscribe/${product._id!!}`;
      let ButtonIcon = MdRocketLaunch;
      let buttonStyle = { ...styles.btn };

      if (hasActiveSubscription) {
          buttonText = "Acessar Produto";
          ButtonIcon = MdLogin;
          // Muda o estilo para verde para destacar que já tem acesso
          buttonStyle = { ...styles.btn, background: "#10b981", boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' };
          
          // Roteamento específico por Produto
          const isFinance = product.description?.toLowerCase().includes('financeiro');
          
          if (isFinance) {
              buttonLink = '/finanlito';
          } 
          // Adicione outros 'else if' aqui para outros produtos futuros
      }

      return (
        <div 
          className={product.quantityStock === 0 ? "outOfStockCard" : ""} 
          style={{
            ...styles.card,
            ...(product.quantityStock === 0 ? { opacity: 0.6 } : null)
          }}
          id={`item-${itemIndex}`}
        >
          
          <div style={styles.cardBody}>
            <div style={styles.itemImageArea}>
              <img
                src={`${BASE_URL}/files/image?fileName=${product.imagePaths[0]}`}
                alt={product.description}
                style={styles.itemImage} 
                loading="lazy"
              />
            </div>

            <div style={styles.itemInfoArea}>
              <div>
                  <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 700, color: '#1e293b' }}>
                    {product.description || "Produto SaaS"}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 10, lineHeight: 1.4 }}>
                    {truncateDescription(product.description)}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>A partir de</span>
                    <p style={styles.price}>{product.price}<span style={{fontSize: 14, fontWeight: 400}}>/mês</span></p>
                  </div>
              </div>
            </div>
          </div>
          
          {/* BOTÃO DINÂMICO */}
          <div style={{ ...styles.rowBetween, marginTop: 15 }}> 
            <Link
              to={buttonLink}
              style={{
                ...buttonStyle,
                width: '100%',
                textDecoration: "none", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                ...(product.quantityStock === 0 ? { opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' } : null),
              }}
            >
              <ButtonIcon size={18} />
              {buttonText}
            </Link>
          </div>
        </div>
      );
    }
  );

  // 5. Passando ordersClient para o renderProduct
  const renderProduct = useCallback(
    (item: CartItem, index: number) => (
      <ItemComponent
        key={item._id!!}
        product={item}
        itemIndex={index}
        ordersClient={ordersClient} // <--- Passando a prop aqui
      />
    ),
    [ordersClient] // <--- Adicionado na dependência para atualizar quando carregar os pedidos
  );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
              <button
                onClick={() => setMenuVisible((p) => !p)}
                style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
                aria-label="Abrir menu"
                title="Abrir menu"
              >
                <MdMenu size={30} />
              </button>
      
              <h1 style={styles.headerTitle}>Soluções</h1>
      
              <span style={{ width: 30 }} />
            </header>

      <main style={styles.container} ref={listRef}>
        <div style={styles.searchBarWrap}>
          <input
            style={styles.searchInput}
            placeholder="Encontre a ferramenta ideal..."
            value={searchQuery}
            onChange={(e) => handleSearchText(e.target.value)}
          />
          
          {searchQuery.length > 0 && (
            isSearching ? (
              <span style={styles.textBtn}>...</span>
            ) : isSearchActive ? (
              <span role="button" onClick={clearSearch} style={styles.textBtn}>×</span>
            ) : (
              <span role="button" onClick={handleSearch} style={styles.textBtn}>🔍</span>
            )
          )}
        </div>

        <div style={styles.productsGrid}>
          {filteredProducts.map((item, idx) => 
            item.disable ? <></> : renderProduct(item, idx))}
        </div>

        {isLoading ? (
          <p style={{ textAlign: "center", padding: 20 }}>Carregando…</p>
        ) : (
            filteredProducts.length === 0 ? (
              <div style={styles.noProductsText}>Nenhuma solução encontrada.</div>
          ) : (
          <button onClick={loadMoreProducts} style={styles.footerBtn} disabled={noFetchMore || isLoading || notIsLoading}>
            Ver mais soluções
          </button>
          )
        )}
      </main>

      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        hasFinancialAccess={hasActiveFinance}
        onProducts={() => handleMenuOption("Produtos")}
        onMinhaConta={() => handleMenuOption("Minha Conta")}
        onPoliticaPrivacidade={() => handleMenuOption("Pop")}
        onMinhasAssinaturas={() => handleMenuOption("Minhas Assinaturas")}
        onSobre={() => handleMenuOption("Sobre")}
        onContatos={() => handleMenuOption("Contacts")}
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
        osEditor={() => handleMenuOption('Gerador de OSs')}
      />
    </div>
  );
};

export default HomePage;

const styles: Record<string, React.CSSProperties> = {
  page: { 
    minHeight: "100vh", 
    background: "#f8fafc", 
    display: "flex",
    flexDirection: "column" as const, 
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden", 
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

  container: { 
    width: "100%", 
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px",
    flex: 1,
    boxSizing: "border-box",
  },

  searchBarWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    background: "#fff",
    paddingRight: 12,
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  searchInput: { 
    flex: 1, 
    height: 48, 
    padding: "0 16px", 
    border: "none", 
    outline: "none" as const, 
    fontSize: 16, 
    background: 'transparent',
    borderRadius: 12 
  },
  textBtn: { cursor: "pointer", padding: "0 8px", fontSize: 18, color: '#64748b' },

  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
    gap: 24,
    padding: "10px 0",
    width: "100%",
    boxSizing: "border-box",
    justifyContent: "center",
  },
  noProductsText: { textAlign: 'center', color: '#64748b', fontSize: 16, marginTop: 40 },

  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    border: "1px solid #e2e8f0",
    boxSizing: "border-box",
    width: "100%",
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  cardBody: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 20,
    alignItems: 'flex-start',
  },

  itemImageArea: {
    flex: "0 0 80px",
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    boxSizing: "border-box",
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  itemInfoArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    flex: "1 1 auto",
    minWidth: 0,
  },

  price: { 
    fontSize: 24, 
    color: "#4f46e5", 
    fontWeight: 800 as const, 
    margin: 0 
  },

  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },

  btn: {
    background: "#4f46e5",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 10,
    border: 0,
    cursor: "pointer",
    fontWeight: 600 as const,
    fontSize: 16,
    textAlign: "center" as const,
    transition: 'background 0.2s',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
  },

  footerBtn: {
    background: "transparent",
    color: "#4f46e5",
    padding: "12px 24px",
    borderRadius: 8,
    border: "2px solid #4f46e5",
    cursor: "pointer",
    fontWeight: 600 as const,
    display: "block",
    margin: "30px auto",
    fontSize: 15,
  },
};