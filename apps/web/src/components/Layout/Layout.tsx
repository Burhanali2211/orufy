import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartSidebar } from '../Cart/CartSidebar';
import { BottomNav } from './BottomNav';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Only mount CartSidebar after it has been opened once — avoids rendering it on every page load
  const cartEverOpened = useRef(false);
  if (isCartOpen) cartEverOpened.current = true;
  const location = useLocation();
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isAuthPage = location.pathname === '/auth';
  const isCheckoutPage = location.pathname.startsWith('/checkout');

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background-primary">

      {!isDashboardPage && !isAuthPage && !isCheckoutPage && (
        <Header
          onAuthClick={() => { }}
          onCartClick={() => setIsCartOpen(true)}
        />
      )}

      <main className={`${!isDashboardPage && !isAuthPage && !isCheckoutPage ? "pt-[98px] md:pt-[92px]" : ""} relative`}>
        <div className={`min-h-[calc(100vh-200px)] ${!isDashboardPage && !isAuthPage && !isCheckoutPage ? "pb-16 md:pb-0" : ""}`}>
          {children}
        </div>
      </main>

      {!isDashboardPage && !isAuthPage && !isCheckoutPage && <Footer />}

      {!isDashboardPage && !isAuthPage && !isCheckoutPage && (
        <BottomNav onCartClick={() => setIsCartOpen(true)} />
      )}

      {cartEverOpened.current && (
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
      )}
    </div>
  );
};