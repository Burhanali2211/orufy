import { useSettings } from '../contexts/SettingsContext';

export const useCartButtonStyles = () => {
  const { getSiteSetting } = useSettings();

  // Get dynamic cart button settings (Default: Store Charcoal #1c1917)
  const cartButtonText = getSiteSetting('cart_button_text') || 'Add to Cart';
  const cartButtonColor = getSiteSetting('cart_button_color') || '#1c1917'; // Charcoal stone-900
  const cartButtonTextColor = getSiteSetting('cart_button_text_color') || '#ffffff';

  // Generate dynamic styles
  const cartButtonStyle = {
    backgroundColor: cartButtonColor,
    color: cartButtonTextColor,
    transition: 'all 0.2s ease',
    fontWeight: '700',
    letterSpacing: '0.025em',
  };

  const cartButtonHoverStyle = {
    backgroundColor: getSiteSetting('cart_button_hover_color') || '#292524', // stone-800
    filter: 'brightness(1.05)',
    boxShadow: '0 4px 12px rgba(28, 25, 23, 0.25)',
  };

  return {
    cartButtonText,
    cartButtonStyle,
    cartButtonHoverStyle,
  };
};