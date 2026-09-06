import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm'; // Asegúrate de que este archivo exista
import useCartStore from '../store/cartStore';

// ⚠️ ¡SÍ! PEGA AQUÍ TU CLAVE PÚBLICA COMPLETA DE STRIPE. 
// No borres ningún carácter. Ejemplo: 'pk_test_51Qxxxxxxxx...xxxxxjNRq'
   const stripePromise = loadStripe('pk_test_51UCUftAbdFzVfXTNE461DmsAPPkLjlG0lJfOXfNu1aFwv0EZqgeoguFXm5Qz7kx1VgX8qYKqJqbpQfgWlMkoRYLe00kLyzjNRq');
function Cart() {
  const { cart, total, isCartOpen, toggleCart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  
  const [clientSecret, setClientSecret] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Cuando el usuario hace clic en "Proceder al Pago"
  const handleInitiatePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // Pedimos al backend que cree el "PaymentIntent" en Stripe
      const response = await fetch('http://localhost:4000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_amount: total }),
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true); // Mostramos el formulario de tarjeta
      } else {
        alert('Error al iniciar el pago: ' + (data.error || 'Desconocido'));
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
      alert('Error de conexión con el servidor de pagos.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Cuando el pago en CheckoutForm es exitoso
  const handlePaymentSuccess = () => {
    alert('¡Pago exitoso! Gracias por tu compra. 🎉');
    clearCart(); // Vaciamos el carrito
    setShowCheckout(false); // Ocultamos el formulario
    setClientSecret('');
    toggleCart(); // Cerramos el carrito lateral
  };

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
          // VISTA 1: Resumen del carrito
          <>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/80'} 
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600">${item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >-</button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >+</button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800 text-xl"
                  >🗑️</button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
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
          // VISTA 2: Formulario de Pago de Stripe
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💳 <strong>Modo de Prueba:</strong> Usa la tarjeta <br/>
                <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
              </p>
            </div>

            {/* Elements envuelve el formulario y le pasa la configuración de Stripe */}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>

            <button 
              onClick={() => { setShowCheckout(false); setClientSecret(''); }} 
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

export default Cart;