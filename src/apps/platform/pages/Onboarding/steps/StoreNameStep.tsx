import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const StoreNameStep: React.FC = () => {
  const { data, updateBusiness, nextStep, prevStep } = useOnboarding();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateSubdomain = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    const name = data.business.name;
    if (name.trim().length < 2) {
      setIsAvailable(null);
      setErrorMsg(null);
      return;
    }

    const subdomain = generateSubdomain(name);
    if (!subdomain || subdomain.length < 2) {
      setIsAvailable(false);
      setErrorMsg('Store name must contain valid letters or numbers.');
      return;
    }

    setIsChecking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/platform/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
        const result = await response.json();
        
        if (result.available) {
          setIsAvailable(true);
          setErrorMsg(null);
          // Auto update the subdomain based on the name
          updateBusiness({ subdomain: result.subdomain });
        } else {
          setIsAvailable(false);
          setErrorMsg(result.reason || 'This name is not available.');
        }
      } catch (err) {
        setIsAvailable(null);
        setErrorMsg('Error checking availability. Please try again.');
      } finally {
        setIsChecking(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.business.name]);

  const handleNameChange = (name: string) => {
    updateBusiness({ name });
  };

  const isValid = data.business.name.trim().length >= 2 && isAvailable === true && !isChecking;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          What's your store's name?
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          This will appear on your storefront header, customer invoices, and order receipts.
        </p>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Premium Input */}
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={data.business.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className={`w-full px-5 py-4 text-xl sm:text-2xl font-bold text-stone-900 bg-stone-50 border-2 rounded-2xl focus:outline-none focus:bg-white transition-all placeholder:text-stone-300 pr-12 ${
                isAvailable === false ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-stone-900'
              }`}
            />
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isChecking && <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />}
              {!isChecking && isAvailable === true && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              {!isChecking && isAvailable === false && <XCircle className="w-6 h-6 text-red-500" />}
            </div>
            
            {/* Domain Availability Feedback */}
            <div className="mt-3 min-h-[24px]">
              {isChecking ? (
                <p className="text-sm font-medium text-stone-500 flex items-center gap-1.5">
                  Checking availability for <span className="font-bold text-stone-700">{generateSubdomain(data.business.name)}.get-oru.com</span>...
                </p>
              ) : isAvailable === true ? (
                <p className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                  Great! <span className="font-bold">{data.business.subdomain}.get-oru.com</span> is available.
                </p>
              ) : isAvailable === false && errorMsg ? (
                <p className="text-sm font-medium text-red-500 flex items-center gap-1.5">
                  {errorMsg}
                </p>
              ) : null}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-200/60">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={!isValid}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                isValid
                  ? 'bg-stone-900 hover:bg-stone-800 active:scale-95 text-white cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

