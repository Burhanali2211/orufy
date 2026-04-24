import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Product } from '../types';

interface UseAddToWishlistWithAuthReturn {
  handleAddToWishlist: (product: Product) => void;
}

export const useAddToWishlistWithAuth = (): UseAddToWishlistWithAuthReturn => {
  const { user } = useAuth();
  const { addItem: addToWishlist } = useWishlist();
  const { showAuthModal } = useAuthModal();

  const handleAddToWishlist = (product: Product) => {
    // Check if user is authenticated
    if (user) {
      // User is logged in, add item to wishlist directly
      addToWishlist(product);
    } else {
      // User is not logged in, show authentication modal
      showAuthModal(product, 'wishlist');
    }
  };

  return {
    handleAddToWishlist
  };
};