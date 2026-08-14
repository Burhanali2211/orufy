import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  premium?: boolean;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children, 
  premium = false 
}) => (
  <div className="border-b border-neutral-100 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left hover:bg-neutral-25 rounded-lg transition-colors px-2"
    >
      <div className="flex items-center space-x-3">
        <div className={`${premium ? 'text-amber-500' : 'text-neutral-600'}`}>{icon}</div>
        <span className={`font-medium text-sm ${premium ? 'text-amber-900' : 'text-neutral-900'}`}>
          {title}
          {premium && <Crown className="inline h-3 w-3 ml-1 text-amber-500" />}
        </span>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-4 w-4 text-neutral-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      )}
    </button>
    
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="pb-4 px-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface QuickFilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  premium?: boolean;
}

export const QuickFilterButton: React.FC<QuickFilterButtonProps> = ({ 
  label, 
  isActive, 
  onClick, 
  icon, 
  premium = false 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
      isActive
        ? premium
          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300 shadow-sm'
          : 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700 border border-neutral-300 shadow-sm'
        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
    }`}
  >
    {icon && <span className="text-xs">{icon}</span>}
    <span>{label}</span>
  </button>
);
