/**
 * Unified Cart Button Hook
 *
 * Consolidated from:
 * - useCartButtonState.ts (cart button state management)
 * - useCartButtonStyles.ts (cart button styling)
 */

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/ShoppingContext';
import { useSettings } from '../contexts/SettingsContext';
import { Product } from '../types';

// ==================== CART BUTTON STATE ====================

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

// ==================== CART BUTTON STYLES ====================

export const useCartButtonStyles = () => {
  const { getSiteSetting } = useSettings();

  // Get dynamic cart button settings
  const cartButtonText = getSiteSetting('cart_button_text') || 'Add to Cart';
  const cartButtonColor = getSiteSetting('cart_button_color') || '#166534'; // Forest green
  const cartButtonTextColor = getSiteSetting('cart_button_text_color') || '#ffffff'; // Default white

  // Generate dynamic styles
  const cartButtonStyle = {
    backgroundColor: cartButtonColor,
    color: cartButtonTextColor,
    transition: 'all 0.2s ease',
    fontWeight: '700',
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
  };

  const cartButtonHoverStyle = {
    backgroundColor: getSiteSetting('cart_button_hover_color') || '#14532d', // green-900
    filter: 'brightness(1.05)',
    boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)',
  };

  return {
    cartButtonText,
    cartButtonStyle,
    cartButtonHoverStyle,
  };
};

// ==================== UNIFIED CART BUTTON HOOK ====================

/**
 * Combined hook for cart button functionality
 */
export const useCartButton = (product: Product) => {
  const state = useCartButtonState(product);
  const styles = useCartButtonStyles();

  return {
    ...state,
    ...styles
  };
};

export default useCartButton;
