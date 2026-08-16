import React, { useState } from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { StoreNameStep } from './steps/StoreNameStep';
import { CategoryStep } from './steps/CategoryStep';
import { BrandStoryStep } from './steps/BrandStoryStep';
import { BrandThemeStep } from './steps/BrandThemeStep';
import { PaymentStep } from './steps/PaymentStep';
import { DomainStep } from './steps/DomainStep';
import { LaunchStep } from './steps/LaunchStep';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';


const STEP_LABELS = [
  'Welcome',
  'Store Name',
  'Category',
  'Brand Story',
  'Aesthetic',
  'Payments',
  'Web Address',
  'Launch',
];

const StudioHeader: React.FC<{ onSaveAndExit: () => void; isSaving: boolean }> = ({ onSaveAndExit, isSaving }) => {
  const { currentStep } = useOnboarding();

  return (
    <header className="sticky top-0 z-40 w-full px-6 py-5 sm:px-10 flex items-center justify-between bg-white border-b border-stone-100">
      {/* Left: Minimal Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-stone-900 text-white rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
          MB
        </div>
        <span className="text-sm font-bold text-stone-900">
          Store Setup
        </span>
      </div>

      {/* Right: Exit Action */}
      <button
        type="button"
        onClick={onSaveAndExit}
        disabled={isSaving}
        className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors"
      >
        {isSaving ? 'Saving…' : 'Save & Exit'}
      </button>

      {/* Progress Runner (Ultra-thin fixed top) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
        <div
          className="h-full bg-stone-900 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / STEP_LABELS.length) * 100}%` }}
        />
      </div>
    </header>
  );
};

const StepRenderer: React.FC = () => {
  const { currentStep } = useOnboarding();

  switch (currentStep) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <StoreNameStep />;
    case 3:
      return <CategoryStep />;
    case 4:
      return <BrandStoryStep />;
    case 5:
      return <BrandThemeStep />;
    case 6:
      return <PaymentStep />;
    case 7:
      return <DomainStep />;
    case 8:
      return <LaunchStep />;
    default:
      return <WelcomeStep />;
  }
};

const OnboardingFlow: React.FC = () => {
  const { data, currentStep } = useOnboarding();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      if (user?.id) {
        await fetch('/api/platform/onboarding/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id,
          },
          body: JSON.stringify(data),
        });
      }
    } catch {
      // LocalStorage draft already persisted
    } finally {
      setIsSaving(false);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return <></>;
  }

  return (
    <div
      className="onboarding-stage min-h-screen bg-white flex flex-col text-stone-900 antialiased selection:bg-stone-200"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {currentStep !== 8 && <StudioHeader onSaveAndExit={handleSaveAndExit} isSaving={isSaving} />}

      {/* Centered, Airy, Focused Stage */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center items-center">
        <StepRenderer />
      </main>
    </div>
  );
};

export const OnboardingPage: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
};

export default OnboardingPage;
