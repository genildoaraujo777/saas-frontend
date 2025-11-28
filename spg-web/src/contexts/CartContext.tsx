// src/contexts/CartContext.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CartItem } from '@/types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (cartItem: CartItem) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  updateCart: (productId: string, quantityChange: number) => void;
  getQuantitySelected: (productId: string) => number;
  setQuantitySelected: (productId: string, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (cartItem: CartItem) => {
    setCartItems((prev) => [...prev, cartItem]);
  };

  const increaseQuantity = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const decreaseQuantity = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateCart = (productId: string, quantityChange: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity: quantityChange } : item
      )
    );
  };

  const getQuantitySelected = useCallback((productId: string) => {
    const item = cartItems.find((i) => i._id === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  const setQuantitySelected = (productId: string, quantity: number) => {
    const exists = cartItems.find((item) => item._id === productId);
    if (exists) {
      updateCart(productId, quantity);
    } else {
      // Produto não está no carrinho; mantém comportamento original (não adiciona).
      // console.warn(`Produto ${productId} não encontrado no carrinho.`);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        updateCart,
        getQuantitySelected,
        setQuantitySelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
