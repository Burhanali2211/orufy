import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';

/**
 * Hook to manage cart button state
 * Returns whether product is in cart and handles "just added" animation state
 */
export const useCartButtonState = (product: Product) => {
  const { items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  // Check if product is in cart
  const isInCart = items.some(
    item => item.product.id === product.id
  );

  // Handle "just added" state - show for 2 seconds after adding
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => {
        setJustAdded(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justAdded]);

  const markAsJustAdded = () => {
    setJustAdded(true);
  };

  return {
    isInCart,
    justAdded,
    markAsJustAdded,
    buttonState: justAdded ? 'added' : isInCart ? 'in-cart' : 'default'
  };
};

