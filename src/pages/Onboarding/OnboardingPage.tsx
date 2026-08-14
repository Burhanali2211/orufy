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
import { ShoppingBag } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


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
    <header
      className="bg-white/80 backdrop-blur-xl border-b border-black/[0.07] sticky top-0 z-40 px-6 sm:px-10 py-3"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between h-9">

        {/* Left: Brand mark — clean Lucide icon in a pill */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-[#1d1d1f] text-white flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
            <ShoppingBag className="w-[14px] h-[14px] stroke-[1.75]" />
          </div>
          <span className="text-[13px] font-semibold text-[#1d1d1f] tracking-[-0.01em]">
            Store Setup
          </span>
        </div>

        {/* Center: Step indicator capsule — Google Material / Apple style */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((_, idx) => {
            const num = idx + 1;
            const done = num < currentStep;
            const active = num === currentStep;
            return (
              <div
                key={num}
                className={`rounded-full transition-all duration-300 ${
                  active
                    ? 'w-5 h-[6px] bg-[#0071e3]'
                    : done
                    ? 'w-[6px] h-[6px] bg-[#0071e3]/40'
                    : 'w-[6px] h-[6px] bg-[#d2d2d7]'
                }`}
              />
            );
          })}
        </div>

        {/* Right: Apple-style blue text link action */}
        <button
          type="button"
          onClick={onSaveAndExit}
          disabled={isSaving}
          className="text-[13px] font-medium text-[#0071e3] hover:opacity-70 transition-opacity cursor-pointer"
          style={{ letterSpacing: '-0.01em' }}
        >
          {isSaving ? 'Saving…' : 'Save & Exit'}
        </button>
      </div>

      {/* Ultra-thin progress runner */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black/[0.05]">
        <div
          className="h-full bg-[#0071e3] transition-all duration-500 ease-out"
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
  const { data } = useOnboarding();
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
      className="onboarding-stage min-h-screen bg-[#f5f5f7] flex flex-col text-[#1d1d1f] antialiased selection:bg-[#0071e3]/20"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <StudioHeader onSaveAndExit={handleSaveAndExit} isSaving={isSaving} />

      {/* Centered, Airy, Focused Stage */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center">
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
