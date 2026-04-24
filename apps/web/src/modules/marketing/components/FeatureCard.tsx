import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group bg-white border border-[#E5E1D8] p-10 rounded-3xl transition-all duration-500 hover:border-[#6344F5] hover:shadow-[0_30px_60px_rgba(99,68,245,0.1)]">
      <div className="w-16 h-16 bg-[#6344F5]/5 rounded-2xl flex items-center justify-center text-[#6344F5] mb-8 transition-all duration-500 group-hover:bg-[#6344F5] group-hover:text-white">
        <Icon size={32} strokeWidth={2} />
      </div>
      <h3 className="font-black text-2xl text-[#1A1A1A] mb-4 tracking-tight">{title}</h3>
      <p className="text-lg text-gray-500 leading-relaxed font-sans">{description}</p>
    </div>
  );
};

export default FeatureCard;
