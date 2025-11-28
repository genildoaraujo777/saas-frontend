// src/features/products/productsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { Product } from '@/types';

interface ProductsState {
  products: Product[];
}

const initialState: ProductsState = {
  products: [
    // Exemplo com imagens (no Vite/Web, prefira import estático):
    // { id: '1', name: 'Martelo', price: 100, image: marteloPng, quantity: 0 },
    // { id: '2', name: 'Vassoura', price: 200, image: vassouraPng, quantity: 0 },
    // { id: '3', name: 'Lixeira', price: 300, image: lixeiraPng, quantity: 0 },
    // { id: '4', name: 'Lamparina', price: 400, image: lamparinaPng, quantity: 0 },
  ],
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Adicione reducers aqui se precisar (ex.: setProducts, addProduct, removeProduct)
  },
});

export default productsSlice.reducer;
