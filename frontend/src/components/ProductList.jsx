import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const addToCart = useCartStore((state) => state.addToCart);

  // 🔥 OPTIMIZACIÓN 1: Cargar productos solo una vez
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://ecommerce-app-owte.onrender.com/api/products');
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // ← Array vacío = solo se ejecuta una vez

  // 🔥 OPTIMIZACIÓN 2: Memoizar la función addToCart
  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, [addToCart]);

  // 🔥 OPTIMIZACIÓN 3: Memoizar productos ordenados (opcional)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.price - b.price);
  }, [products]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 text-xl">
        ❌ Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🛒 Tienda E-commerce
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

// 🔥 OPTIMIZACIÓN 4: Componente separado con React.memo
const ProductCard = React.memo(({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* 🔥 OPTIMIZACIÓN 5: Lazy Loading nativo en imágenes */}
      <img 
        src={product.image_url || 'https://via.placeholder.com/300'} 
        alt={product.name}
        loading="lazy"  // ← ¡Lazy loading!
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          {product.name}
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  );
});

// Exportar con React.memo para evitar re-renders innecesarios
export default React.memo(ProductList);