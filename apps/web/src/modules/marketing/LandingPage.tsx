import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrandBar from './components/BrandBar';
import Features from './components/Features';
import Pricing from './components/Pricing';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

/**
 * SaaS Marketing Landing Page
 * 
 * Modularized and separated from the e-commerce storefront logic.
 */
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FCFBF7] font-sans selection:bg-[#6344F5]/30 overflow-x-hidden">
      <Navbar />
      <Hero />
      <BrandBar />
      <Features />
      <Pricing />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default LandingPage;

