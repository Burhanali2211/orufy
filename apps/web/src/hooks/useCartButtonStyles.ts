import { useSettings } from '../contexts/SettingsContext';

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