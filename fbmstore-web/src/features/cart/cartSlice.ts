// src/store/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';

interface CartState {
  items: Product[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state: CartState, action: PayloadAction<Product>) => {
      state.items.push(action.payload);
    },
    // Outros reducers como remover item, limpar carrinho, etc. podem ser adicionados aqui
  },
});

export const { addToCart } = cartSlice.actions;
export default cartSlice.reducer;
