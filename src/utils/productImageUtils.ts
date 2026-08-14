// Utility function to get safe product image source with fallback
export const getProductImageSrc = (product: { name?: string; images?: string[] }, fallbackLetter?: string) => {
  // Try to get the first valid image
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const imageUrl = product.images[0];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      return imageUrl;
    }
  }
  
  // Generate fallback image with first letter of product name
  const name = product.name || 'Product';
  const firstLetter = (fallbackLetter || name.charAt(0) || 'P').toUpperCase();
  
  // Color palette for consistent styling
  const colors = [
    { bg: '#E3F2FD', text: '#1976D2' }, // Blue
    { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple  
    { bg: '#E8F5E8', text: '#388E3C' }, // Green
    { bg: '#FFF3E0', text: '#F57C00' }, // Orange
    { bg: '#FCE4EC', text: '#C2185B' }, // Pink
    { bg: '#E0F2F1', text: '#00796B' }, // Teal
    { bg: '#FFF8E1', text: '#F9A825' }, // Amber
    { bg: '#EFEBE9', text: '#5D4037' }, // Brown
  ];
  
  // Use ASCII value to determine color consistently
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  // Generate SVG
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color.bg}"/>
    <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" 
          font-size="120" font-weight="600" 
          fill="${color.text}" text-anchor="middle" 
          dominant-baseline="central">${firstLetter}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Error handler for image loading failures
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
  const img = e.target as HTMLImageElement;
  if (img.src !== fallbackSrc) {
    img.src = fallbackSrc;
  }
};

export default getProductImageSrc;