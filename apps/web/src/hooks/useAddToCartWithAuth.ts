import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useNotification } from '../contexts/NotificationContext';
import { Product } from '../types';

interface UseAddToCartWithAuthReturn {
  handleAddToCart: (product: Product, quantity?: number) => void;
}

export const useAddToCartWithAuth = (): UseAddToCartWithAuthReturn => {
  const { user } = useAuth();
  const { addItem: addToCart, items } = useCart();
  const { showAuthModal } = useAuthModal();
  const { showNotification } = useNotification();

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    // Check if product is already in cart
    const isInCart = items.some(
      item => item.product.id === product.id
    );

    if (isInCart) {
      // Item is already in cart, show info message instead of adding again
      showNotification({
        type: 'info',
        title: 'Already in Cart',
        message: `${product.name} is already in your cart. You can update the quantity from the cart page.`,
        duration: 4000
      });
      return;
    }

    // Check if user is authenticated
    if (user) {
      // User is logged in, add item to cart directly
      addToCart(product, quantity);
    } else {
      // User is not logged in, show authentication modal
      showAuthModal(product, 'cart');
    }
  };

  return {
    handleAddToCart
  };
};