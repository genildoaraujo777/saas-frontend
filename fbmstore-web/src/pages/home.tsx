import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Menu from "@/components/ui/Menu";
import { useStock } from "@/contexts/StockContext";
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
        navigate('/oslito');
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
          const isOsLito = product.description?.toLowerCase().includes('ordens de serviço');
          
          if (isFinance) {
              buttonLink = '/finanlito';
          } 
          if (isOsLito) {
              buttonLink = '/oslito';
          } 
          // Adicione outros 'else if' aqui para outros produtos futuros
      }

      return (
        <div 
          className={`saas-card ${product.quantityStock === 0 ? "outOfStockCard" : ""}`} 
          style={{
            ...styles.card,
            ...(product.quantityStock === 0 ? { opacity: 0.6 } : null)
          }}
          id={`item-${itemIndex}`}
        >
          <div style={styles.itemImageArea}>
            <img
              src={`${BASE_URL}/files/image?fileName=${product.imagePaths[0]}`}
              alt={product.description}
              style={styles.itemImage} 
              loading="lazy"
            />
          </div>

          <div style={{ marginTop: 20, flex: 1 }}>
            <h3 style={styles.cardTitle}>{product.description || "Produto SaaS"}</h3>
            <p style={styles.cardDesc}>{truncateDescription(product.description)}</p>
            
            <div style={styles.priceContainer}>
              <span style={styles.priceTag}>R$ {product.price}</span>
              <span style={styles.priceFreq}>/mês</span>
            </div>
          </div>

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
              marginTop: 20,
              ...(product.quantityStock === 0 ? { opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' } : null),
            }}
          >
            <ButtonIcon size={18} />
            {buttonText}
          </Link>
        </div>
      );
    }
  );

  // 5. Passando ordersClient para o renderProduct
  const renderProduct = useCallback(
    (item: CartItem, index: number) => (
      <ItemComponent
        key={item._id || `item-${index}`}
        product={item}
        itemIndex={index}
        ordersClient={ordersClient} // <--- Passando a prop aqui
      />
    ),
    [ordersClient] // <--- Adicionado na dependência para atualizar quando carregar os pedidos
  );

  <style>{`
  .saas-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  }
  .search-focus:focus-within {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
  }
`}</style>
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
        <section style={styles.hero}>
          <div style={styles.heroBadge}>PLATAFORMA INTEGRADA</div>
          <h2 style={styles.heroTitle}>
            Potencialize sua <span style={{ color: '#4f46e5' }}>Produtividade</span>
          </h2>
          <p style={styles.heroSubtitle}>
            Acesse suas ferramentas, gerencie assinaturas e controle seu negócio em um só lugar.
          </p>
        </section>
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
          {filteredProducts
            .filter(item => !item.disable) // Filtra apenas os ativos antes de processar
            .map((item, idx) => renderProduct(item, idx))
          }
        </div>

        {isLoading ? (
          <p style={{ textAlign: "center", padding: 20 }}>Carregando…</p>
        ) : 
            filteredProducts.length === 0 ? (
              <div style={styles.noProductsText}>Nenhuma solução encontrada.</div>
            ) : (
            filteredProducts.length > 10 ? 
              (<button onClick={loadMoreProducts} style={styles.footerBtn} disabled={noFetchMore || isLoading || notIsLoading}>
                Ver mais soluções
              </button>) : (
              <></>
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
  page: { minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", width: "100%" },
  header: { background: "#0f172a", color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
  headerTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  container: { width: "100%", maxWidth: 1200, margin: "0 auto", padding: "40px 20px" },
  
  hero: { textAlign: 'center' as const, marginBottom: 50 },
  heroBadge: { background: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 16 },
  heroTitle: { fontSize: 42, fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.025em' },
  heroSubtitle: { fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' },

  searchBarWrap: { display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", paddingRight: 12, width: "100%", maxWidth: 600, margin: "0 auto 40px auto", transition: 'all 0.2s' },
  searchInput: { flex: 1, height: 54, padding: "0 20px", border: "none", outline: "none", fontSize: 16, background: 'transparent' },

  productsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 30 },
  
  card: { background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #f1f5f9", display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' },
  itemImageArea: { width: 64, height: 64, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 },
  itemImage: { width: "100%", height: "100%", objectFit: "contain" },
  cardTitle: { fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  cardDesc: { fontSize: 15, color: '#64748b', lineHeight: 1.5, marginBottom: 16 },
  priceContainer: { display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 'auto' },
  priceTag: { fontSize: 22, color: '#0f172a', fontWeight: 800 },
  priceFreq: { fontSize: 14, color: '#94a3b8' },

  btn: { background: "#4f46e5", color: "#fff", padding: "14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 600, fontSize: 15, transition: 'all 0.2s' },
};