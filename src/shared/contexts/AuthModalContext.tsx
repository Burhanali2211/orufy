import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types';
import AuthModal from '../components/Auth/AuthModal';

interface AuthModalContextType {
  showAuthModal: (product: Product, action: 'cart' | 'wishlist' | 'compare') => void;
  hideAuthModal: () => void;
  isModalOpen: boolean;
  modalAction: 'cart' | 'wishlist' | 'compare' | null;
  selectedProduct: Product | null;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'cart' | 'wishlist' | 'compare' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const showAuthModal = (product: Product, action: 'cart' | 'wishlist' | 'compare') => {
    setSelectedProduct(product);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const hideAuthModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setSelectedProduct(null);
  };

  const handleModalClose = () => {
    hideAuthModal();
  };

  const value: AuthModalContextType = {
    showAuthModal,
    hideAuthModal,
    isModalOpen,
    modalAction,
    selectedProduct
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
        {isModalOpen && createPortal(
          <AuthModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            initialMode="login"
            action={modalAction}
            product={selectedProduct}
          />,
          document.body
        )}
    </AuthModalContext.Provider>
  );
};