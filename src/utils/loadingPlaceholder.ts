/**
 * Loading Placeholder Utilities
 * Prevents layout shift when data loading
 */

/**
 * Generates skeleton array for rendering placeholders
 */
export function generateSkeletons(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

/**
 * CSS class names for skeleton animations
 */
export const SKELETON_STYLES = {
  base: 'bg-gray-200 hidden rounded',
  container: 'space-y-4',
  line: 'h-4 bg-gray-200 rounded hidden',
  productCard: 'space-y-3',
  imageBox: 'w-full h-48 bg-gray-200 rounded-lg hidden',
  textLine: 'h-3 bg-gray-200 rounded hidden',
  textLineShort: 'h-3 bg-gray-200 rounded hidden w-2/3',
  button: 'h-10 bg-gray-200 rounded-lg hidden w-full',
};

/**
 * Reserved space dimensions (prevents shift)
 */
export const SPACE_RESERVE = {
  productImage: 'aspect-square', // 1:1 ratio for images
  productCard: 'min-h-80', // Minimum height for card
  listItem: 'min-h-16', // List item minimum
  paragraph: 'space-y-2', // Paragraph spacing
};
