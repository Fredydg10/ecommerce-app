import useCartStore from '../store/cartStore';

function CartButton() {
  const { cart, toggleCart } = useCartStore();
  
  // Calculamos el total de items en el carrito
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={toggleCart}
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center justify-center"
      style={{ width: '60px', height: '60px' }}
    >
      🛒
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          {totalItems}
        </span>
      )}
    </button>
  );
}

export default CartButton;