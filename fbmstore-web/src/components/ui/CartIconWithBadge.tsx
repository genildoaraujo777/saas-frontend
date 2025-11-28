// src/components/ui/CartIconWithBadge.tsx
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { MdShoppingCart } from 'react-icons/md';

type Props = { onPress: () => void };

const CartIconWithBadge: React.FC<Props> = ({ onPress }) => {
  const { cartItems } = useCart();
  // mesma lógica do seu RN: conta itens (não a quantidade)
  const totalItems = cartItems.reduce((sum) => sum + 1, 0);

  return (
    <button
      onClick={onPress}
      style={styles.container}
      aria-label="Abrir carrinho"
    >
      <MdShoppingCart size={30} color="white" />
      {totalItems > 0 && (
        <span style={styles.badge}>
          <span style={styles.badgeText}>{totalItems}</span>
        </span>
      )}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginRight: 15,
    position: 'relative',           // garante posicionamento do badge
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#e799a6',
    borderRadius: 50,
    width: 20,
    height: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 1,
  },
};

export default CartIconWithBadge;
