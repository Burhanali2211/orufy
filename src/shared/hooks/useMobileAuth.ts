import { useAuth } from '@/shared/contexts/AuthContext';

export const useMobileAuth = () => {
  const {
    isMobileAuthOpen,
    mobileAuthMode,
    openMobileAuth,
    closeMobileAuth
  } = useAuth();

  return {
    isOpen: isMobileAuthOpen,
    mode: mobileAuthMode,
    open: openMobileAuth,
    close: closeMobileAuth
  };
};