import ProductList from './components/ProductList';
import Cart from './components/Cart';
import CartButton from './components/CartButton';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        🛒 Mi Tienda E-commerce
      </h1>
      <ProductList />
      <Cart />
      <CartButton />
    </div>
  );
}

export default App;