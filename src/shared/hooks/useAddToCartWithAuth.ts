import { useCart } from '@/shared/contexts/CartContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { Product } from '../types';

interface UseAddToCartWithAuthReturn {
  handleAddToCart: (product: Product, quantity?: number) => void;
}

export const useAddToCartWithAuth = (): UseAddToCartWithAuthReturn => {
  const { addItem: addToCart, items } = useCart();
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

    // Add item to cart directly for all users (guests and logged in)
    addToCart(product, quantity);
  };

  return {
    handleAddToCart
  };
};