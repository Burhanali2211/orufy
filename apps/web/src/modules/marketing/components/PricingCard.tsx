import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  features,
  highlighted = false,
}) => {
  const [amount, period] = price.split('/');

  return (
    <div
      className={`relative p-12 bg-white ${
        highlighted ? 'bg-[#FCFBF7] z-10 shadow-[0_0_100px_rgba(99,68,245,0.1)]' : ''
      } transition-all duration-500 border-r border-[#E5E1D8] last:border-r-0`}
    >
      {highlighted && (
        <span className="absolute top-0 left-0 w-full h-1 bg-[#6344F5]"></span>
      )}
      
      <div className="mb-10">
        <h4 className="font-black text-sm uppercase tracking-[0.2em] text-[#6344F5] mb-4">{name}</h4>
        <div className="flex items-baseline">
          <span className="text-5xl font-black text-[#1A1A1A] tracking-tighter">{amount}</span>
          {period && (
            <span className="text-lg text-gray-400 font-bold ml-1">/{period}</span>
          )}
        </div>
      </div>

      <ul className="space-y-6 mb-12">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-4 text-lg text-gray-500 font-medium">
            <div className="mt-1 w-5 h-5 rounded-full bg-[#6344F5]/10 flex items-center justify-center text-[#6344F5] shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/signup"
        className={`block text-center w-full py-5 rounded-full text-sm font-black tracking-widest uppercase transition-all duration-500 ${
          highlighted
            ? 'bg-[#6344F5] text-white hover:bg-[#1A1A1A] shadow-xl shadow-[#6344F5]/30'
            : 'bg-[#1A1A1A] text-white hover:bg-[#6344F5]'
        }`}
      >
        Select Plan
      </Link>
    </div>
  );
};

export default PricingCard;
