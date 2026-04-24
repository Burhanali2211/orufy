import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Heart, Minus, Plus, Shield, Truck, RotateCcw, Award } from 'lucide-react';
import { Product } from '../../types';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { useCartButtonState } from '../../hooks/useCartButtonState';
import { AddToCartButton } from './AddToCartButton';

interface ProductDetailsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, isOpen, onClose }) => {
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const { cartButtonText, cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
  const { isInCart, justAdded, markAsJustAdded, buttonState } = useCartButtonState(product);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCartClick = () => {
    if (!isInCart) {
      handleAddToCart(product, quantity);
      markAsJustAdded();
    } else {
      handleAddToCart(product, quantity);
    }
  };

  const features = [
    { icon: Truck, title: 'Free Shipping', text: 'On orders over ₹999' },
    { icon: RotateCcw, title: 'Easy Returns', text: '30-day return policy' },
    { icon: Shield, title: 'Secure Payment', text: '100% secure checkout' },
    { icon: Award, title: 'Genuine Product', text: '100% authentic guarantee' },
  ];

  // Category specific highlights
  const isTech = product.category?.toLowerCase().includes('electronics');

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur shadow-md rounded-full hover:bg-white transition-colors"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Side: Images */}
                <div className="p-8 lg:p-12 bg-gray-50/50">
                  <div className="aspect-square mb-6 rounded-2xl overflow-hidden bg-white shadow-inner">
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  {product.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                            selectedImage === index ? 'border-purple-600 shadow-md scale-105' : 'border-transparent bg-white'
                          }`}
                        >
                          <img
                            src={image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Info */}
                <div className="p-8 lg:p-12 flex flex-col max-h-[85vh] overflow-y-auto">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                        {product.category}
                      </span>
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                          Low Stock: Only {product.stock} left
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                      {product.name}
                    </h1>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                        <Star className="h-4 w-4 text-amber-500 fill-current" />
                        <span className="ml-1.5 font-bold text-gray-900">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500 underline underline-offset-4 cursor-pointer">
                        {product.reviewCount || 0} customer reviews
                      </span>
                    </div>

                    <div className="flex items-baseline gap-4 mb-8">
                      <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.originalPrice && (
                        <span className="text-xl text-gray-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                      )}
                      {product.originalPrice && (
                        <span className="text-sm font-bold text-emerald-600">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 leading-relaxed text-lg mb-8">
                      {product.description}
                    </p>

                    {/* Tech Specs Placeholder */}
                    {isTech && (
                      <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                         <div>
                           <p className="text-xs text-blue-600 font-bold uppercase mb-1">Authentic</p>
                           <p className="text-sm text-gray-900 font-semibold">100% Genuine</p>
                         </div>
                         <div>
                           <p className="text-xs text-blue-600 font-bold uppercase mb-1">Shipping</p>
                           <p className="text-sm text-gray-900 font-semibold">Fast Delivery</p>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="mt-auto">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">Total: ₹{(product.price * quantity).toLocaleString('en-IN')}</p>
                        <p className="text-emerald-600 font-medium text-xs">Tax included</p>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-10">
                      <AddToCartButton 
                        product={product}
                        className="flex-1 h-14 text-lg"
                        size="lg"
                      />
                      
                      <button
                        onClick={() => handleAddToWishlist(product)}
                        className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
                      >
                        <Heart className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-4">
                      {features.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                          <item.icon className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{item.title}</p>
                            <p className="text-[10px] text-gray-500">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
};
