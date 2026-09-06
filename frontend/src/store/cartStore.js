import { create } from 'zustand';

const useCartStore = create((set) => ({
  // Estado inicial
  cart: [],
  total: 0,
  isCartOpen: false,

  // Acciones
  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find(item => item.id === product.id);
    
    let newCart;
    if (existingItem) {
      newCart = state.cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...state.cart, { ...product, quantity: 1 }];
    }

    const newTotal = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return { cart: newCart, total: newTotal };
  }),

  removeFromCart: (productId) => set((state) => {
    const newCart = state.cart.filter(item => item.id !== productId);
    const newTotal = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { cart: newCart, total: newTotal };
  }),

  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return useCartStore.getState().removeFromCart(productId);
    }

    const newCart = state.cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    const newTotal = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { cart: newCart, total: newTotal };
  }),

  clearCart: () => set({ cart: [], total: 0 }),

  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}));

export default useCartStore;