import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShieldCheck, Truck, Plus, Minus,
  MessageSquare, ShoppingCart, ShoppingBag, Check,
  ArrowRight, Package, TrendingUp, FileText, Star, X, ThumbsUp
} from 'lucide-react';
import { useProducts } from '@/shared/contexts/ProductContext';
import { useCart } from '@/shared/contexts/CartContext';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useAuthModal } from '@/shared/contexts/AuthModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReview } from '@/shared/components/Product/ProductReview';
import { ReviewForm } from '@/shared/components/Product/ReviewForm';
import { ProductRecommendations } from '@/shared/components/Product/ProductRecommendations';
import { Modal } from '@/shared/components/Common/Modal';

import { Review, Product } from '@/shared/types';
import { useCartButtonState } from '@/shared/hooks/useCartButtonState';
import { LuxuryGallery } from '@/shared/components/Product/LuxuryGallery';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, fetchReviewsForProduct, submitReview } = useProducts();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const { addItem: addToCart, items, itemCount, total } = useCart();
  const { addItem: addToWishlist, isInWishlist, items: wishlistItems } = useWishlist();
  const { showNotification } = useNotification();
  const { showAuthModal } = useAuthModal();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCartWidgetDismissed, setIsCartWidgetDismissed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const dummyProduct: Product = {
    id: '', name: '', price: 0, stock: 0, images: [], rating: 0,
    description: '', reviews: [], sellerId: '', sellerName: '',
    tags: [], featured: false, showOnHomepage: true, createdAt: new Date(),
    categoryId: ''
  };

  const cartButtonState = useCartButtonState(product || dummyProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await getProductById(id);
        setProduct(productData || null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, getProductById]);

  useEffect(() => {
    if (!product) return;
    (async () => {
      setReviewsLoading(true);
      const r = await fetchReviewsForProduct(product.id);
      setReviews(r);
      setReviewsLoading(false);
    })();
  }, [product, fetchReviewsForProduct]);

  if (loading) return <></>;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow max-w-sm w-full">
          <Package className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Product Not Found</h2>
          <p className="text-stone-500 text-sm mb-6">The product you're looking for is unavailable.</p>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 hover:underline">
            Browse All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) { showAuthModal(product, 'cart'); return; }
    if (!cartButtonState.isInCart) {
      addToCart(product, quantity);
      cartButtonState.markAsJustAdded();
    } else {
      showNotification({ type: 'info', title: 'Already in Cart', message: `${product.name} is already in your cart.`, duration: 3000 });
    }
  };

  const handleToggleWishlist = () => product && addToWishlist(product);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user) {
      showNotification({ type: 'error', title: 'Login Required', message: 'Please login to leave a review.' });
      return;
    }
    await submitReview({ productId: product.id, userId: user.id, rating, comment });
    const updatedReviews = await fetchReviewsForProduct(product.id);
    setReviews(updatedReviews);
    showNotification({ type: 'success', title: 'Review Submitted', message: 'Thank you for your feedback!' });
    setIsReviewModalOpen(false);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const tabs = [
    { id: 'description', name: 'Description', icon: FileText },
    { id: 'reviews', name: `Reviews (${reviews.length})`, icon: MessageSquare },
  ];

  const images = product.images && product.images.length > 0 ? product.images : [''];
  const wishlistCount = wishlistItems.filter(item => item.id === product.id).length;

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Mobile Header with Back + Wishlist */}
      <div className="fixed top-4 left-4 right-4 z-40 md:hidden flex items-center justify-between pointer-events-none">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-full transition-colors pointer-events-auto flex items-center justify-center">
          <X className="h-5 w-5 text-white" />
        </button>
        <Link to="/wishlist" className="relative w-10 h-10 bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-full transition-colors pointer-events-auto flex items-center justify-center">
          <Heart className="h-5 w-5 text-white" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6 lg:py-8">

        {/* Image Carousel Section */}
        <div className="lg:sticky lg:top-24">
          <div className="w-full relative overflow-hidden bg-white">
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Image Dots */}
          <div className="flex items-center justify-center gap-2.5 py-2 md:py-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`rounded-full transition-all ${
                  i === currentImageIndex ? 'w-3 h-3 bg-gray-900' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="px-4 py-6 md:py-0 md:px-0 space-y-4 md:space-y-6">

          {/* Rating Row */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-3.5 w-3.5 md:h-4 md:w-4 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
            <span className="text-sm md:text-base font-semibold text-gray-900">{product.rating.toFixed(1)}</span>
            <div className="flex items-center gap-1 text-sm md:text-base text-gray-600">
              <ThumbsUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="font-semibold">3.8</span>
            </div>
            {reviews.length > 0 && (
              <button onClick={() => setActiveTab('reviews')} className="text-sm md:text-base text-gray-500 hover:text-gray-700 transition-colors">
                {reviews.length} Reviews
              </button>
            )}
          </div>

          {/* Product Name */}
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">₹{(product.price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            {hasDiscount && (
              <span className="text-base md:text-lg text-gray-400 line-through">₹{(product.originalPrice! / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            )}
          </div>

          {/* About This Product */}
          <div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              {product.shortDescription || product.description.split('.')[0] + '.'}
            </p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700">Authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700">Easy Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700">Warranty</span>
            </div>
          </div>

          {/* Quantity + Stock */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-4 w-4 text-gray-900" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30"
              >
                <Plus className="h-4 w-4 text-gray-900" />
              </button>
            </div>
            {product.stock > 0 && product.stock < 10 && (
              <span className="text-xs md:text-sm text-red-500 font-semibold">Only {product.stock} left</span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 h-12 md:h-14 rounded-lg md:rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                product.stock === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart' ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
              {product.stock === 0 ? 'Out of Stock' : cartButtonState.buttonState === 'added' ? 'Added!' : 'Add to Cart'}
            </motion.button>

            <button
              onClick={handleToggleWishlist}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-full flex items-center justify-center border-2 transition-all ${
                isInWishlist(product.id)
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-900'
              }`}
              aria-label="Add to wishlist"
            >
              <Heart className="h-5 w-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS: Description / Reviews ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="mt-10 sm:mt-16 lg:mt-20">
          <div className="flex border-b border-stone-200 mb-6 sm:mb-10 gap-6 sm:gap-10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {tab.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl"
            >
              {activeTab === 'description' && (
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  {product.description}
                </p>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Customer Reviews</h3>
                      <p className="text-sm text-stone-400">What our customers say</p>
                    </div>
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="h-10 px-6 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all w-full sm:w-auto"
                    >
                      Write a Review
                    </button>
                  </div>
                  {reviewsLoading ? <></> : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map(review => <ProductReview key={review.id} review={review} />)}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-stone-100">
                      <MessageSquare className="mx-auto h-10 w-10 text-stone-200 mb-3" />
                      <p className="font-medium text-stone-700">Be the First to Review</p>
                      <p className="text-stone-400 text-sm mt-1">Share your experience with this product.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RECOMMENDATIONS ── */}
        <div className="mt-10 sm:mt-16 lg:mt-24 pt-8 sm:pt-12 border-t border-stone-200">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-3xl font-serif text-stone-900">You May Also Like</h2>
              <p className="text-stone-400 text-sm mt-1">Curated picks to go with this</p>
            </div>
            <Link to="/products" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductRecommendations
            currentProduct={product}
            type="related"
            maxItems={4}
            className="curated-grid"
          />
        </div>
      </div>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Write a Review">
        <div className="p-4">
          <p className="text-stone-500 text-sm mb-4">Share your thoughts about this product.</p>
          <ReviewForm onSubmit={handleReviewSubmit} />
        </div>
      </Modal>

      {/* Bottom-Right Desktop Floating Cart Bar (Specific Product Page) */}
      <AnimatePresence>
        {items.length > 0 && !isCartWidgetDismissed && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[60] hidden md:flex items-center gap-4 bg-stone-900 text-white p-3.5 pr-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail of last added item */}
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-stone-800 border border-stone-700 flex-shrink-0">
                <img 
                  src={items[items.length - 1]?.product?.images?.[0] || '/images/collection.png'} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute -top-1 -right-1 bg-stone-100 text-stone-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-stone-300 shadow-xs">
                  {itemCount}
                </span>
              </div>

              {/* Cart Info */}
              <div className="text-left">
                <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
                  <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'} in Cart</span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  Total: <span className="text-white font-bold">₹{(total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>

            {/* Direct Action Buttons (Minimal Styling - NO Yellow) */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
              <Link
                to="/cart"
                className="bg-white hover:bg-stone-100 text-stone-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95"
              >
                Go to Cart <ArrowRight className="w-3.5 h-3.5 text-stone-900" />
              </Link>
              <button
                onClick={() => setIsCartWidgetDismissed(true)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;
