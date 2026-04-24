import React, { useEffect, useState } from 'react';
import { Droplets, Star, Award, Users, Lock, Truck, ShieldCheck } from 'lucide-react';
import { SiteLogo } from '../Common/SiteLogo';

interface ProfessionalAuthLayoutProps {
  children: React.ReactNode;
  showBranding?: boolean;
}

export const ProfessionalAuthLayout: React.FC<ProfessionalAuthLayoutProps> = ({
  children,
  showBranding = true
}) => {
  const [customerCount, setCustomerCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const animateNumber = (target: number, setter: (n: number) => void, duration: number = 2000) => {
      const start = 0;
      const increment = target / (duration / 50);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 50);

      return () => clearInterval(timer);
    };

    animateNumber(25000, setCustomerCount);
    animateNumber(8500, setReviewCount);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-orange-50 flex items-center justify-center p-4">
      {showBranding ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Branding & Trust Signals */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-stone-800 via-stone-900 to-black rounded-3xl p-10 text-white overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"></div>
            
            {/* Spice pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5C30 5 35 15 35 20C35 25 30 30 30 30C30 30 25 25 25 20C25 15 30 5 30 5Z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>

            {/* Header */}
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <SiteLogo size="lg" variant="white" />
                <h1 className="text-2xl font-bold tracking-wide">Orufy</h1>
              </div>

              <h2 className="text-3xl font-bold mb-4 leading-tight tracking-tight">
                Artisan Woven Goods. Organic Craft.
              </h2>

              <p className="text-white/90 text-base mb-8 max-w-md leading-relaxed">
                Discover handmade woven bags, artisan baskets, hand woolen purses & sustainable craft products — ethically sourced.
              </p>
            </div>

            {/* Value Propositions */}
            <div className="relative z-10">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 hover:bg-white/20">
                  <Droplets className="h-6 w-6 mb-2 text-stone-300" />
                  <h3 className="font-semibold text-sm mb-1">Handmade</h3>
                  <p className="text-xs text-white/80">Woven with care</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 hover:bg-white/20">
                  <Droplets className="h-6 w-6 mb-2 text-stone-300" />
                  <h3 className="font-semibold text-sm mb-1">Artisan Direct</h3>
                  <p className="text-xs text-white/80">Support local families</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all duration-300 hover:bg-white/20">
                  <Star className="h-6 w-6 mb-2 text-stone-300" />
                  <h3 className="font-semibold text-sm mb-1">Organic Materials</h3>
                  <p className="text-xs text-white/80">Sustainable choice</p>
                </div>
              </div>

              {/* Social Proof - Trust Signals */}
              <div className="space-y-4 border-t border-white/20 pt-6">
                {/* Customer Count */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{customerCount.toLocaleString('en-IN')}+ Happy Customers</p>
                    <p className="text-xs text-white/70">Across India & worldwide</p>
                  </div>
                </div>

                {/* Reviews */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{reviewCount.toLocaleString('en-IN')}+ 5-Star Reviews</p>
                    <p className="text-xs text-white/70">Trusted by craft lovers</p>
                  </div>
                </div>

                {/* Shipping */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Free Shipping over ₹999</p>
                    <p className="text-xs text-white/70">All India delivery</p>
                  </div>
                </div>

                {/* Security */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">100% Secure Payments</p>
                    <p className="text-xs text-white/70">Your data is protected</p>
                  </div>
                </div>

                {/* Welcome Offer */}
                <div className="mt-6 bg-gradient-to-r from-stone-600/40 to-orange-600/40 backdrop-blur-sm rounded-xl p-4 border border-stone-400/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-stone-300" />
                    <p className="text-sm font-semibold">New Member Offer</p>
                  </div>
                  <p className="text-xs text-white/90">Get 10% off your first order + free artisan gift tag with every order!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200">
            {children}
          </div>
        </div>
      ) : (
        /* Centered Form Layout */
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalAuthLayout;

