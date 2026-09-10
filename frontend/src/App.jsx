import React from 'react';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import useCartStore from './store/cartStore';
import logo from './assets/logo-1.png';

// Componente del botón del carrito
function CartButton() {
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cart = useCartStore((state) => state.cart);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={toggleCart}
      className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <span className="inline-flex items-center gap-2">
        <img src={logo} alt="" className="h-5 w-5 object-contain" />
        Carrito
      </span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-blue-600">
            <img src={logo} alt="Logo de Mi Tienda E-commerce" className="h-9 w-9 object-contain" />
            Mi Tienda E-commerce
          </h1>
          <CartButton />
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8">
        <ProductList />
      </main>
      
      {/* Carrito Lateral */}
      <Cart />
    </div>
  );
}

export default App;