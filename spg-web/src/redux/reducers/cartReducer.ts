interface Product {
    id: string;
    name: string;
    price: number;
  }
  
  interface CartState {
    items: Product[];
  }
  
  const initialState: CartState = {
    items: [],
  };
  
  interface AddToCartAction {
    type: 'ADD_TO_CART';
    product: Product;
  }
  
  interface RemoveFromCartAction {
    type: 'REMOVE_FROM_CART';
    productId: string;
  }
  
  type CartActionTypes = AddToCartAction | RemoveFromCartAction;
  
  const cartReducer = (state = initialState, action: CartActionTypes): CartState => {
    switch (action.type) {
      case 'ADD_TO_CART':
        return {
          ...state,
          items: [...state.items, action.product],
        };
      case 'REMOVE_FROM_CART':
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.productId),
        };
      default:
        return state;
    }
  };
  
  export default cartReducer;
  