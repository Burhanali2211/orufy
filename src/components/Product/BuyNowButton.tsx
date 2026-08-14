import React, { useState, useCallback } from 'react';
import { ShoppingBag, Package, Check } from 'lucide-react';

type BtnState = 'idle' | 'packing' | 'done';

interface BuyNowButtonProps {
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const BuyNowButton: React.FC<BuyNowButtonProps> = ({ disabled, onClick, className = '' }) => {
  const [state, setState] = useState<BtnState>('idle');

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || state !== 'idle') return;
    onClick(e);
    setState('packing');
    setTimeout(() => setState('done'), 900);
    setTimeout(() => setState('idle'), 1900);
  }, [disabled, state, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden w-full flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-colors duration-300 cursor-pointer ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : state === 'done'
          ? 'bg-green-600 text-white'
          : 'bg-gray-900 hover:bg-gray-800 text-white'
      } ${className}`}
      aria-label="Add to cart"
    >
      {/* Idle */}
      <span className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ${state === 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 absolute'}`}>
        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {disabled ? 'Out of Stock' : 'Buy Now'}
      </span>

      {/* Packing */}
      <span className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ${state === 'packing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 absolute'}`}>
        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" />
        Packing…
      </span>

      {/* Done */}
      <span className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ${state === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 absolute'}`}>
        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
        Added!
      </span>
    </button>
  );
};
