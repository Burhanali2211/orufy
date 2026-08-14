import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

interface EnhancedButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    title?: string;
    mobileOptimized?: boolean;
}

// Export Button as EnhancedButton for backward compatibility
export const EnhancedButton = Button;

export default EnhancedButton;