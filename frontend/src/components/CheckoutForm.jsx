import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { createOrder } from '../services/api';
import useCartStore from '../store/cartStore';

function CheckoutForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, total, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    try {
      // 1. Confirmar el pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // 2. Si el pago fue exitoso, guardar la orden en nuestra BD PostgreSQL
        const orderData = {
          // ⚠️ CAMBIO CLAVE: Usamos un UUID válido de prueba para que PostgreSQL no se queje
          user_id: '123e4567-e89b-12d3-a456-426614174000', 
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total_amount: total
        };

        await createOrder(orderData);
        clearCart();
        onSuccess(); // Llama a la función de Cart.jsx para cerrar todo y mostrar alerta
      }
    } catch (err) {
      console.error('Error al guardar la orden:', err);
      setError('Error al procesar el pago o guardar la orden.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <CardElement 
          options={{
            style: {
              base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
              invalid: { color: '#9e2146' },
            },
          }} 
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <span className="animate-spin">⏳</span> Procesando pago...
          </>
        ) : (
          `Pagar $${total.toFixed(2)}`
        )}
      </button>
    </form>
  );
}

export default CheckoutForm;