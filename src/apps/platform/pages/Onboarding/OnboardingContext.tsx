import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StarterProduct {
  name: string;
  price: string;
  description: string;
  category?: string;
  image?: string;
}

export interface OnboardingData {
  business: {
    name: string;
    category: string;
    description: string;
    subdomain: string;
    contactEmail: string;
    tagline?: string;
  };
  brand: {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontPairing?: string;
  };
  initialProducts: StarterProduct[];
  payments: {
    connected: boolean;
    provider: 'razorpay' | 'none';
    accountId?: string;
    settlementReady: boolean;
  };
  domain: {
    type: 'subdomain' | 'custom' | 'buy';
    subdomain: string;
    customHostname?: string;
    purchasedHostname?: string;
    isVerified: boolean;
  };
}

export interface Milestone {
  id: number;
  key: 'name' | 'category' | 'story' | 'theme' | 'payments' | 'domain' | 'launch';
  title: string;
  description: string;
  isComplete: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateBusiness: (business: Partial<OnboardingData['business']>) => void;
  updateBrand: (brand: Partial<OnboardingData['brand']>) => void;
  addProduct: (product: StarterProduct) => void;
  removeProduct: (index: number) => void;
  updatePayments: (payments: Partial<OnboardingData['payments']>) => void;
  updateDomain: (domain: Partial<OnboardingData['domain']>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  progressPercentage: number;
  milestones: Milestone[];
  isMilestoneComplete: (stepId: number) => boolean;
}

const defaultData: OnboardingData = {
  business: {
    name: '',
    category: 'General E-commerce',
    description: '',
    subdomain: '',
    contactEmail: '',
    tagline: 'Handcrafted with Passion & Authenticity',
  },
  brand: {
    primaryColor: '#1d1d1f', // Apple obsidian
    secondaryColor: '#86868b',
    logoUrl: '',
    fontPairing: 'sans',
  },
  initialProducts: [],
  payments: {
    connected: false,
    provider: 'razorpay',
    settlementReady: false,
  },
  domain: {
    type: 'subdomain',
    subdomain: '',
    isVerified: true,
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(() => {
    try {
      const saved = localStorage.getItem('agy_merchant_onboarding_draft');
      if (saved) {
        return { ...defaultData, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultData;
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const stepParam = parseInt(searchParams.get('step') || '', 10);
        if (!isNaN(stepParam) && stepParam >= 1 && stepParam <= 8) {
          return stepParam;
        }
        const savedStep = localStorage.getItem('agy_merchant_onboarding_step');
        if (savedStep) {
          const parsed = parseInt(savedStep, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return 1;
  });

  // Keep URL query param and browser history in sync with currentStep
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('agy_merchant_onboarding_step', currentStep.toString());
      
      const currentUrl = new URL(window.location.href);
      const activeParam = currentUrl.searchParams.get('step');
      
      if (activeParam !== currentStep.toString()) {
        currentUrl.searchParams.set('step', currentStep.toString());
        // Use pushState so browser back/forward button navigates 1 step at a time
        window.history.pushState({ step: currentStep }, '', currentUrl.toString());
      }
    } catch {
      // ignore
    }
  }, [currentStep]);

  // Listen to browser Back / Forward navigation (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial history state if not already set
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.get('step')) {
      currentUrl.searchParams.set('step', currentStep.toString());
      window.history.replaceState({ step: currentStep }, '', currentUrl.toString());
    }

    const handlePopState = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const stepFromUrl = parseInt(params.get('step') || '', 10);
      if (!isNaN(stepFromUrl) && stepFromUrl >= 1 && stepFromUrl <= 8) {
        setCurrentStep(stepFromUrl);
      } else if (event.state?.step && typeof event.state.step === 'number') {
        setCurrentStep(Math.max(1, Math.min(8, event.state.step)));
      } else {
        setCurrentStep(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('agy_merchant_onboarding_draft', JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const updateBusiness = (business: Partial<OnboardingData['business']>) => {
    setData((prev) => {
      const updatedBusiness = { ...prev.business, ...business };
      if (business.name && (!prev.business.subdomain || prev.business.subdomain === prev.business.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
        const cleanSub = business.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        updatedBusiness.subdomain = cleanSub;
      }
      return {
        ...prev,
        business: updatedBusiness,
        domain: {
          ...prev.domain,
          subdomain: updatedBusiness.subdomain || prev.domain.subdomain,
        },
      };
    });
  };

  const updateBrand = (brand: Partial<OnboardingData['brand']>) => {
    setData((prev) => ({ ...prev, brand: { ...prev.brand, ...brand } }));
  };

  const addProduct = (product: StarterProduct) => {
    setData((prev) => ({
      ...prev,
      initialProducts: [...prev.initialProducts, product],
    }));
  };

  const removeProduct = (index: number) => {
    setData((prev) => ({
      ...prev,
      initialProducts: prev.initialProducts.filter((_, i) => i !== index),
    }));
  };

  const updatePayments = (payments: Partial<OnboardingData['payments']>) => {
    setData((prev) => ({ ...prev, payments: { ...prev.payments, ...payments } }));
  };

  const updateDomain = (domain: Partial<OnboardingData['domain']>) => {
    setData((prev) => ({ ...prev, domain: { ...prev.domain, ...domain } }));
  };

  const isMilestoneComplete = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return true; // Welcome step is always complete
      case 2:
        return Boolean(data.business.name.trim().length >= 2);
      case 3:
        return Boolean(data.business.category);
      case 4:
        return Boolean(data.business.tagline || data.business.description);
      case 5:
        return Boolean(data.brand.primaryColor);
      case 6:
        return true; // Payments configuration selected
      case 7:
        return Boolean(
          (data.domain.type === 'subdomain' && (data.domain.subdomain || data.business.subdomain)) ||
          (data.domain.type === 'custom' && data.domain.customHostname)
        );
      case 8:
        return isMilestoneComplete(2) && isMilestoneComplete(3) && isMilestoneComplete(5);
      default:
        return false;
    }
  };

  const milestones: Milestone[] = [
    { id: 2, key: 'name', title: 'Store Name', description: 'Name your store', isComplete: isMilestoneComplete(2) },
    { id: 3, key: 'category', title: 'Category', description: 'What you sell', isComplete: isMilestoneComplete(3) },
    { id: 4, key: 'story', title: 'Brand Story', description: 'Tagline and bio', isComplete: isMilestoneComplete(4) },
    { id: 5, key: 'theme', title: 'Aesthetic', description: 'Theme and styling', isComplete: isMilestoneComplete(5) },
    { id: 6, key: 'payments', title: 'Payments', description: 'Payout options', isComplete: isMilestoneComplete(6) },
    { id: 7, key: 'domain', title: 'Web Address', description: 'Store URL and SSL', isComplete: isMilestoneComplete(7) },
    { id: 8, key: 'launch', title: 'Launch', description: 'Publish storefront', isComplete: false },
  ];

  const progressPercentage = Math.min(
    100,
    15 +
    (isMilestoneComplete(2) ? 15 : 0) +
    (isMilestoneComplete(3) ? 15 : 0) +
    (isMilestoneComplete(4) ? 15 : 0) +
    (isMilestoneComplete(5) ? 15 : 0) +
    (isMilestoneComplete(6) ? 15 : 0) +
    (isMilestoneComplete(7) ? 10 : 0)
  );

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 8));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateBusiness,
        updateBrand,
        addProduct,
        removeProduct,
        updatePayments,
        updateDomain,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        progressPercentage,
        milestones,
        isMilestoneComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
