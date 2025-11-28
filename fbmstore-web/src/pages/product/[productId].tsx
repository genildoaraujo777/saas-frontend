import CartIconWithBadge from '@/components/ui/CartIconWithBadge';
import { useCart } from '@/contexts/CartContext';
import { useStock } from '@/contexts/StockContext';
import { CartItem, Product } from '@/types'; // Use o tipo Product se já existir
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ProductDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const productParam =
    (location.state as any)?.product ??
    new URLSearchParams(location.search).get('product');

  // Tipar o produto corretamente ajuda a evitar erros
  const product: Product | null =
    typeof productParam === 'string' ? JSON.parse(productParam) : productParam;

  const { cartItems, addToCart, updateCart, getQuantitySelected, setQuantitySelected } = useCart();
  const { stockItems } = useStock();
  const [qtdStock, setQtdStock] = useState<number>(0);
  const [inputValue, setInputValue] = useState('0');
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ✅ ESTADO PARA GERENCIAR A IMAGEM PRINCIPAL
  // Inicializa com a primeira imagem do array, se existir.
  const [currentImagePath, setCurrentImagePath] = useState(product?.imagePaths?.[0] || '');

  // ✅ LÓGICA ATUALIZADA PARA USAR O ARRAY `imagePaths`
  const productImages = useMemo(() => {
    // Retorna o array de imagens do produto ou um array vazio como fallback.
    return product?.imagePaths || [];
  }, [product?.imagePaths]);

  // Sincroniza a imagem principal caso o produto seja alterado
  useEffect(() => {
    if (product?.imagePaths && product.imagePaths.length > 0) {
      setCurrentImagePath(product.imagePaths[0]);
    } else {
      setCurrentImagePath(''); // Define como vazio ou um placeholder se não houver imagens
    }
  }, [product]);

  if (!product) {
    return <div style={styles.noProductsText}>Produto não encontrado</div>;
  }

  // Header
  const Header = (
    <div style={styles.header}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        Voltar
      </button>
      <div style={styles.headerTitle}>Detalhes do Produto</div>
      <CartIconWithBadge onPress={() => navigate('/cart')} />
    </div>
  );

useEffect(() => {
  // ✅ SOLUÇÃO: Verifica se product._id existe antes de usá-lo.
  if (!product?._id) {
    return; // Para a execução do useEffect se não houver um ID de produto.
  }

  const stockItem = stockItems.find((item) => item._id === product._id);
  const cartItem = cartItems.find((item) => item._id === product._id);

  // Agora o TypeScript sabe que product._id é uma string, pois passou pela verificação acima.
  const current = getQuantitySelected(product._id);
  if (current === undefined) {
    const initial = cartItem?.quantity ?? 0;
    setQuantitySelected(product._id, initial);
    setInputValue(String(initial));
  } else {
    setInputValue(String(current));
  }

  if (stockItem) {
    setQtdStock(stockItem.quantityStock);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [stockItems, cartItems, product?._id]);

  const handleAddToCart = (productItem: CartItem, selectedQuantity: number) => {
    const stockItem = stockItems.find((item) => item._id === productItem._id);

    if (stockItem && selectedQuantity > stockItem.quantityStock) {
      alert(`Estoque Insuficiente\nA quantidade disponível é ${stockItem.quantityStock}.`);
    } else if (selectedQuantity === 0) {
      alert(`A quantidade deve ser maior que zero.`);
    } else {
      if (cartItems.some((item) => item._id === productItem._id)) {
        updateCart(productItem._id!, selectedQuantity);
      } else {
        addToCart({ ...productItem, quantity: selectedQuantity });
      }
      alert('Produto adicionado/atualizado no carrinho!');
    }
  };

  return (
    <>
      {Header}
      <div style={styles.pageContainer}>
        <div style={styles.mainWrapper}>
          {/* ⬅️ ÁREA DA IMAGEM E MINIATURAS */}
          <div style={styles.imageArea}>
            {/* ✅ Imagem Principal - URL corrigida e com fallback */}
            <img
              src={currentImagePath ? `${BASE_URL}/files/image?fileName=${currentImagePath}` : 'https://via.placeholder.com/350'}
              style={styles.productImage}
              alt={product.description ?? 'Produto'}
            />

            {/* ✅ Miniaturas - Mapeando o array `productImages` */}
            <div style={styles.thumbnailsWrapper}>
              {productImages.map((path, index) => (
                <img
                  key={index}
                  src={`${BASE_URL}/files/image?fileName=${path}`}
                  style={{
                    ...styles.thumbnailImage,
                    border: path === currentImagePath ? '2px solid #e799a6' : '2px solid #ddd',
                  }}
                  alt={`Miniatura ${index + 1}`}
                  onClick={() => setCurrentImagePath(path)} // Atualiza a imagem principal ao clicar
                />
              ))}
            </div>
          </div>

          {/* ➡️ ÁREA DE INFORMAÇÕES */}
          <div style={styles.infoArea}>
            <h2>{product.description}</h2>
            <div style={styles.productSupplier}>
              Preço: <span style={styles.productPrice}>{product.price}</span>
            </div>
            <div style={styles.productInStock}>Em estoque: {qtdStock}</div>

            <div style={styles.containerQtdSelected}>
              <div style={styles.qtdSelected}>Quantidade:</div>
              <input
                style={styles.quantityInput as React.CSSProperties}
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => {
                    if (!product?._id) {
                    return; // Para a execução se não houver ID
                    }
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  const parsed = parseInt(cleaned || '0', 10);
                  // Limita a quantidade ao estoque disponível
                  const limited = Math.min(parsed, qtdStock || 0);
                  
                  setInputValue(String(limited)); // Atualiza o input com o valor limitado
                  setQuantitySelected(product._id, limited);
                }}
                placeholder="0"
              />
            </div>

            <button
              style={{
                ...styles.buttonBlue,
                ...(qtdStock === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : null),
              }}
              onClick={() => handleAddToCart(product as CartItem, parseInt(inputValue || '0', 10))}
              disabled={qtdStock === 0}
            >
              <span style={styles.buttonText}>Adicionar ao Carrinho</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;

// Estilos (simplifiquei alguns para clareza, mas mantive a estrutura)
const styles: Record<string, React.CSSProperties> = {
  header: { paddingTop: 30, height: 96, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 16, borderBottom: '0.5px solid #ddd' },
  backButton: { background: 'transparent', border: 0, color: '#e799a6', fontSize: 16, cursor: 'pointer' },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#e799a6' },
  pageContainer: { backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 96px)', padding: 20, boxSizing: 'border-box' },
  mainWrapper: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 30, backgroundColor: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 1200, margin: '0 auto' },
  imageArea: { flex: '1 1 350px', maxWidth: 500, minWidth: 300, display: 'flex', flexDirection: 'column' },
  productImage: { width: '100%', height: 350, borderRadius: 10, marginBottom: 10, objectFit: 'contain', border: '1px solid #ddd' },
  thumbnailsWrapper: { display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', paddingBottom: 5 },
  thumbnailImage: { width: 60, height: 60, flexShrink: 0, borderRadius: 5, objectFit: 'cover', cursor: 'pointer', transition: 'border-color 0.2s' },
  infoArea: { flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' },
  productPrice: { fontSize: 24, fontWeight: 'bold', color: '#e799a6' },
  productInStock: { fontSize: 16, color: 'green' },
  containerQtdSelected: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 15 },
  quantityInput: { height: 40, borderColor: 'gray', borderWidth: 1, width: 80, textAlign: 'center', borderRadius: 5, outline: 'none', fontSize: 16 },
  qtdSelected: { fontSize: 16, fontWeight: 'bold' },
  buttonBlue: { backgroundColor: '#e799a6', padding: '12px 16px', borderRadius: 5, alignItems: 'center', border: 0, cursor: 'pointer', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  productSupplier: { fontSize: 16 },
  noProductsText: { color: 'black', textAlign: 'center', marginTop: 50, fontSize: 18 },
};