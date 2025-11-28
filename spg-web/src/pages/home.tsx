import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Menu from "@/components/ui/Menu";
import CartIconWithBadge from "@/components/ui/CartIconWithBadge";
import { useCart } from "@/contexts/CartContext";
import { useCategory } from "@/contexts/CategoryContext";
import { useStock } from "@/contexts/StockContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { CartItem } from "@/types";
import { MdMenu } from "react-icons/md";
import { useClient } from "@/contexts/ClientContext";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();

  const { cartItems, addToCart, updateCart, getQuantitySelected, setQuantitySelected } = useCart();
  const { categoriesItems } = useCategory();
  const { suppliersItems } = useSupplier();
  const { stockItems, fetchMoreProducts, fetchStockItemsByQuery, notIsLoading, isLoading } = useStock();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<CartItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCategoryVisible, setMenuCategoryVisible] = useState(false); // reservado se tiver submenu
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [noFetchMore, setNoFetchMore] = useState(false);
  const [quantityById, setQuantityById] = useState<Record<string, string>>({});
  const [isSearchActive, setIsSearchActive] = useState(false); // 💡 NOVO ESTADO: O filtro de texto está ativo?

  const listRef = useRef<HTMLDivElement | null>(null);
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Header substitui StatusBar/useLayoutEffect
  // (aqui só renderiza um <header/> fixo)

  const memoizedProducts = useMemo(() => {
    return stockItems.map((product) => {
      const cartItem = cartItems.find((item) => item._id === product._id);
      const quantity = cartItem?.quantity || 0;
      return { ...product, quantity };
    });
  }, [stockItems, cartItems]);

  // Inicial / quando muda lista: sem busca → mostra todos
  useEffect(() => {
    if (!searchQuery) setFilteredProducts(memoizedProducts);
  }, [memoizedProducts, stockItems, searchQuery]);

  // Seta quantidades iniciais no contexto do carrinho
  useEffect(() => {
    if (cartItems.length === 0) return;
    const already = new Set<string>();
    cartItems.forEach((item) => {
      if (!already.has(item._id!!)) {
        setQuantitySelected(item._id!!, item.quantity);
        already.add(item._id!!);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém espelho local das quantidades para inputs controlados
  useEffect(() => {
    const map: Record<string, string> = {};
    cartItems.forEach((item) => (map[item._id!!] = String(item.quantity)));
    setQuantityById(map);
  }, [cartItems]);

  // Busca por texto: quando limpa, bloqueia "fetch more"
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
        setIsSearchActive(true); // 💡 NOVO: A busca por texto foi aplicada
      } catch(error) {
         console.error("Erro na busca:", error);
      }
      setIsSearching(false);
    } else {
      // Se a busca for vazia, limpamos a ativação
      setFilteredProducts(memoizedProducts);
      setIsSearchActive(false); 
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setIsSearchActive(false); // 💡 NOVO: Limpamos o estado de filtro ativo
    // Note: O useEffect do searchQuery = "" deve disparar a reexibição de todos os produtos
  };

  const handleAddToCart = (product: CartItem, selectedQuantity: number) => {
    const stockItem = stockItems.find((item) => item._id === product._id);
    if (!stockItem) return;

    if (selectedQuantity > stockItem.quantityStock) {
      window.alert(`Estoque Insuficiente. Disponível: ${stockItem.quantityStock}`);
    } else if (selectedQuantity === 0) {
      window.alert("Quantidade inválida. Informe uma quantidade maior que 0.");
    } else {
      if (cartItems.some((item) => item._id === product._id)) {
        updateCart(product._id!!, selectedQuantity);
      } else {
        addToCart({ ...product, quantity: selectedQuantity });
      }
    }
  };

  const handleMenuOption = (option: string) => {
    switch (option) {
      case "Minha Conta":
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Meus Pedidos":
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
      case 'Pedidos':
        navigate(`/store/orders/${isAdmin}`);
        break;
      case 'Clientes':
        navigate('/clientes');
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
    setMenuCategoryVisible(false);
  };

  const handleSupplier = async (supplierIdParam: string) => {
    const filtered = await fetchStockItemsByQuery("", "", supplierIdParam);
    setFilteredProducts(filtered);
    setNoFetchMore(false);
    setSupplierId(supplierIdParam);
  };

  const loadMoreProducts = () => {
    if (!isLoading && !notIsLoading) fetchMoreProducts();
  };

  const formatCurrency = (value: number | string) =>
    `R$ ${Number(value).toFixed(2).replace(".", ",")}`;

  // Item (memo) --------------------------------------------
  interface ItemProps {
    product: CartItem;
    quantityValue: string;
    setQuantityValue: (value: string) => void;
    onAddToCart: (quantity: number) => void;
    itemIndex: number;
  }

  const ItemComponent = React.memo(
    ({ product, quantityValue, setQuantityValue, onAddToCart, itemIndex }: ItemProps) => {
      const { setQuantitySelected } = useCart();
      const [inputValue, setInputValue] = useState(quantityValue);

      useEffect(() => {
        setInputValue(quantityValue);
      }, [quantityValue]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);
        setQuantityValue(text);
      };

      const handleBlur = () => {
        const parsed = parseInt(inputValue, 10) || 0;
        setQuantitySelected(product._id!!, parsed);
      };

      const truncateDescription = (description: string) => {
          return description.slice(0, 23) + '...';
      };

      return (
        // O card agora é um container de coluna (vertical)
        <div 
          className={product.quantityStock === 0 ? "outOfStockCard" : ""} 
          style={{...styles.card,
            ...(product.quantityStock === 0 ? { opacity: 0.6 } : null)
          }}
          id={`item-${itemIndex}`}
        >
          
          {/* NOVO CONTAINER: CORPO DO CARD (IMAGEM + INFO, EM LINHA) */}
          <div style={styles.cardBody}>
            {/* ⬅️ ÁREA DA IMAGEM (COLUNA ESQUERDA) */}
            <div style={styles.itemImageArea}>
              <img
                src={`${BASE_URL}/files/image?fileName=${product.imagePaths[0]}`}
                alt={product.description}
                style={styles.itemImage} 
                loading="lazy"
              />
            </div>

            {/* ➡️ ÁREA DE INFORMAÇÕES (COLUNA DIREITA) */}
            <div style={styles.itemInfoArea}>
              {/* Bloco de Texto Superior */}
              <div>
                  <p style={{ fontSize: 18, marginBottom: 5, fontWeight: 600 as const }}>
                  {product.description.length >= 23 ? truncateDescription(product.description) : product.description}
                  </p>
                  <p style={styles.price}>Preço: <strong>{product.price}</strong></p>
                  <p style={styles.inStock}>Em estoque: {product.quantityStock}</p>
              </div>


              {/* Input de Quantidade */}
              <div style={styles.containerQtdSelected}>
                <span style={styles.qtdSelected}>Quantidade Escolhida:</span>
                <input
                  type="number"
                  min={0}
                  value={inputValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={() => {
                    document.getElementById(`item-${itemIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  style={styles.qtyInput}
                />
              </div>
            </div>
          </div>
          
          {/* ⬇️ BOTÕES - RODAPÉ DO CARD (OCUPA LARGURA TOTAL) */}
          <div style={{ ...styles.rowBetween }}> 
            <Link
              to={`/product/${product._id!!}`}
              state={{ product }}
              style={{
                ...styles.btn,
                textDecoration: "none", 
                display: "inline-block",
                ...(product.quantityStock === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : null),
              }}
            >
              Ver Detalhes
            </Link>

            <button
              style={{
                ...styles.btn,
                ...(product.quantityStock === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : null),
              }}
              onClick={() => onAddToCart(parseInt(inputValue, 10) || 0)}
            >
              Adicionar
            </button>
          </div>
        </div>
      );
    }
  );

  // Render item
  const renderProduct = useCallback(
    (item: CartItem, index: number) => (
      <ItemComponent
        key={item._id!!}
        product={item}
        quantityValue={quantityById[item._id!!] || "0"}
        setQuantityValue={(value) =>
          setQuantityById((prev) => ({ ...prev, [item._id!!]: value }))
        }
        onAddToCart={(quantity) => handleAddToCart(item, quantity)}
        itemIndex={index}
      />
    ),
    [quantityById] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <button
          onClick={() => setMenuVisible((p) => !p)}
          style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <MdMenu size={30} />
        </button>

        <h1 style={styles.headerTitle}>Produtos</h1>

        <CartIconWithBadge onPress={() => navigate("/cart")} />
      </header>

      {/* Conteúdo */}
      <main style={styles.container} ref={listRef}>
        <div style={styles.searchBarWrap}>
          <input
            style={styles.searchInput}
            placeholder="Pesquisar produtos..."
            value={searchQuery}
            onChange={(e) => handleSearchText(e.target.value)}
          />
          
          {/* AÇÃO ÚNICA: Determina o que fazer quando há texto */}
          {searchQuery.length > 0 && (
            isSearching ? (
              // 1. Está buscando (Loading)
              <span style={styles.textBtn} title="Aguarde">...</span>
            ) : isSearchActive ? (
              // 2. Busca finalizada e aplicada (Ação é Limpar)
              <span role="button" onClick={clearSearch} style={styles.textBtn} title="Limpar">
                ×
              </span>
            ) : (
              // 3. Texto digitado, mas busca ainda não aplicada (Ação é Buscar)
              <span role="button" onClick={handleSearch} style={styles.textBtn} title="Buscar">
                🔍
              </span>
            )
          )}
        </div>

        {/* Lista */}
        <div style={styles.productsGrid}>
          {filteredProducts.map((item, idx) => 
            item.disable ? <></> : renderProduct(item, idx))}
        </div>

        {/* Footer da lista */}
        {isLoading ? (
          <p style={{ textAlign: "center", padding: 20 }}>Carregando…</p>
        ) : (
            filteredProducts.length === 0 ? (
              <div style={styles.noProductsText}>Nenhum produto encontrado.</div>
          ) : (
          <button onClick={loadMoreProducts} style={styles.footerBtn} disabled={noFetchMore || isLoading || notIsLoading}>
            Carregar mais
          </button>
          )
         
        )}
      </main>

      {/* Menu lateral */}
      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        onProducts={() => handleMenuOption("")}
        onMinhaConta={() => handleMenuOption("Minha Conta")}
        onPoliticaPrivacidade={() => handleMenuOption("Pop")}
        onMeusPedidos={() => handleMenuOption("Meus Pedidos")}
        onSobre={() => handleMenuOption("Sobre")}
        onContatos={() => handleMenuOption("Contacts")}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadCategory={() => handleMenuOption('CadCategory')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Pedidos')}
        onSair={logoutClient}
        // hooks/rotas extras quando existirem:
        onTermos={() => {}}
        onAvaliar={() => {}}
        onPreferencias={() => {}}
        onTutorial={() => {}}
        onAssistenteVirtual={() => {}}
      />
    </div>
  );
};

export default HomePage;

// Substitua seu `styles` por este (ou apenas as chaves abaixo)
const styles: Record<string, React.CSSProperties> = {
  page: { 
    minHeight: "100vh", 
    background: "#f5f5f5", 
    display: "flex",
    flexDirection: "column" as const, 
    width: "100%",
    boxSizing: "border-box",
  },

  header: {
    background: "#000",
    color: "#fff",
    padding: "20px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "0.5px solid #ddd",
    width: "100%",
    boxSizing: "border-box",
  },
  headerTitle: { fontSize: 20, fontWeight: 600 as const, color: "#e799a6", margin: 0 },

  container: { 
    width: "100%", 
    maxWidth: 1600,
    margin: "0 auto",
    padding: 10,
    flex: 1 
  },

  searchBarWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #e799a6",
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
    background: "#fff",
    paddingRight: 8,
    width: "100%",
  },
  searchInput: { flex: 1, height: 40, padding: "0 10px", border: "none", outline: "none" as const, fontSize: 14 },
  textBtn: { cursor: "pointer", padding: "0 8px", fontSize: 16 },

  productsList: { width: '100%' },

  // GRID: aumento do min para deixar card com proporção parecida em telas grandes
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
    gap: 20,
    padding: "20px 0",
    width: "100%",
  },
  noProductsText: { textAlign: 'center', color: '#666', fontSize: 16, marginTop: 40 },

  // CARD
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
    width: "100%",
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },

  // Corpo do card: imagem fixada à esquerda + infos à direita
  cardBody: {
    display: 'flex',
    flexDirection: 'row' as const,
    flexWrap: 'nowrap' as const,     // importante: evitar quebra entre imagem e infos
    gap: 12,
    alignItems: 'center',
  },

  // Área da imagem: largura fixa (não 100%) para preservar layout em telas grandes
  itemImageArea: {
    flex: "0 0 120px",   // largura fixa: não cresce nem encolhe abaixo de 120px
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
    boxSizing: "border-box",
  },

  // Imagem: ocupa a área disponível mantendo proporção
  itemImage: {
    width: "100%",
    height: 120,
    objectFit: "contain" as const,
    display: "block",
    border: '1px solid #ddd',
    boxSizing: 'border-box'
  },

  // Área de informações: ocupa o espaço restante
  itemInfoArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    flex: "1 1 auto",
    minWidth: 0, // permite truncar corretamente se necessário
  },

  price: { fontSize: 18, color: "#e799a6", marginBottom: 5 },
  inStock: { fontSize: 14, color: "green", marginBottom: 10 },

  containerQtdSelected: {
    marginTop: 10,
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  qtdSelected: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    flexShrink: 0,
  },

  qtyInput: {
    height: 35,
    border: "1px solid gray",
    width: 60,
    textAlign: "center" as const,
    margin: "0",
    borderRadius: 5,
    outline: 'none' as const,
  },

  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap" as const,
    width: '100%',
    gap: 12,
  },

  btn: {
    background: "#e799a6",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 5,
    border: 0,
    cursor: "pointer",
    fontWeight: 700 as const,
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 100,
    textAlign: "center" as const,
  },

  footerBtn: {
    background: "#e799a6",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 8,
    border: 0,
    cursor: "pointer",
    fontWeight: 700 as const,
    display: "block",
    margin: "10px auto",
  },
};
