import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import useCartStore from '../store/cartStore';

// ⚠️ Reemplaza con tu clave pública real de Stripe
const stripePromise = loadStripe('pk_test_51UCUftAbdFzVfXTNE461DmsAPPkLjlG0lJfOXfNu1aFwv0EZqgeoguFXm5Qz7kx1VgX8qYKqJqbpQfgWlMkoRYLe00kLyzjNRq');

// 🔥 OPTIMIZACIÓN 1: Componente de Item memoizado
const CartItem = React.memo(({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="flex items-center gap-4 border-b pb-4">
      <img 
        src={item.image_url || 'https://via.placeholder.com/80'} 
        alt={item.name}
        loading="lazy"  //  Lazy loading en el carrito también
        className="w-20 h-20 object-cover rounded"
      />
      <div className="flex-1">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-gray-600">${item.price}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >-</button>
          <span className="font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >+</button>
        </div>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-600 hover:text-red-800 text-xl"
      >🗑️</button>
    </div>
  );
});

function Cart() {
  const { cart, total, isCartOpen, toggleCart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  
  const [clientSecret, setClientSecret] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔥 OPTIMIZACIÓN 2: Memoizar el total formateado
  const formattedTotal = useMemo(() => total.toFixed(2), [total]);

  // 🔥 OPTIMIZACIÓN 3: Memoizar funciones para evitar re-renders en CartItem
  const handleRemove = useCallback((id) => removeFromCart(id), [removeFromCart]);
  const handleUpdateQuantity = useCallback((id, qty) => updateQuantity(id, qty), [updateQuantity]);

  // 🔥 OPTIMIZACIÓN 4: Manejo de pago con useCallback
  const handleInitiatePayment = useCallback(async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const response = await fetch('https://ecommerce-app-owte.onrender.com/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_amount: total }),
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true);
      } else {
        alert('Error al iniciar el pago: ' + (data.error || 'Desconocido'));
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
      alert('Error de conexión con el servidor de pagos.');
    } finally {
      setIsProcessing(false);
    }
  }, [cart.length, total]);

  const handlePaymentSuccess = useCallback(() => {
    alert('¡Pago exitoso! Gracias por tu compra. 🎉');
    clearCart();
    setShowCheckout(false);
    setClientSecret('');
    toggleCart();
  }, [clearCart, toggleCart]);

  const handleBackToCart = useCallback(() => {
    setShowCheckout(false);
    setClientSecret('');
  }, []);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🛒 Carrito</h2>
          <button onClick={toggleCart} className="text-gray-600 hover:text-gray-900 text-2xl">✕</button>
        </div>

        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Tu carrito está vacío</p>
        ) : !showCheckout ? (
          <>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">${formattedTotal}</span>
              </div>
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Preparando pago...' : 'Proceder al Pago con Tarjeta'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💳 <strong>Modo de Prueba:</strong> Usa la tarjeta <br/>
                <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
              </p>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>

            <button 
              onClick={handleBackToCart} 
              className="w-full text-gray-600 hover:text-gray-900 py-2 text-sm font-medium"
            >
              ← Volver al resumen del carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(Cart);