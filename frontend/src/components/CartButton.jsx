import useCartStore from '../store/cartStore';
import logo from '../assets/logo-1.png';

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

export default CartButton;