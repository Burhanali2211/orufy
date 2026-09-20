import React, { useState, useEffect } from 'react';
import { Search, Loader2, X, CheckCircle2, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRazorpayInstance } from '../../../../../shared/utils/loadRazorpay';

interface DomainPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (domain: string) => void;
}

interface DomainResult {
  domain: string;
  available: boolean;
  pricePaise: number;
  currency: string;
}

type Step = 'search' | 'searching' | 'results' | 'purchasing' | 'success';

export const DomainPurchaseModal: React.FC<DomainPurchaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [error, setError] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim().toLowerCase();
    
    if (cleanQuery.length < 2) {
      setError('Please enter at least 2 characters.');
      return;
    }

    setStep('searching');
    setError('');

    try {
      const res = await fetch(`/api/platform/domains/search?query=${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search domains');
      }

      setResults(data.results);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching.');
      setStep('search');
    }
  };

  const handleBuy = async (result: DomainResult) => {
    try {
      setStep('purchasing');
      setLoadingMsg('Creating secure order...');
      setError('');

      // 1. Create order
      const orderRes = await fetch('/api/platform/domains/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: result.domain,
          periodYears: 1
        })
      });
      
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 2. Open Razorpay Checkout
      setLoadingMsg('Awaiting payment...');
      
      const razorpay = await getRazorpayInstance({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock',
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: 'Platform Domain Purchase',
        description: `1 Year Registration for ${result.domain}`,
        order_id: orderData.razorpayOrderId.startsWith('order_dom_') ? undefined : orderData.razorpayOrderId, 
        // Note: Mock orders don't need real razorpay order id in frontend for tests
        handler: async (response: any) => {
          try {
            setLoadingMsg('Configuring DNS & Provisioning SSL...');
            
            // 3. Confirm Purchase
            const confirmRes = await fetch('/api/platform/domains/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: orderData.registrationId,
                razorpayPaymentId: response.razorpay_payment_id || 'mock_pay_123',
                razorpayOrderId: response.razorpay_order_id || orderData.razorpayOrderId,
                razorpaySignature: response.razorpay_signature || 'mock_signature'
              })
            });

            const confirmData = await confirmRes.json();

            if (!confirmRes.ok) {
              throw new Error(confirmData.error || 'Domain registration failed during confirmation');
            }

            setStep('success');
            setTimeout(() => {
              onSuccess(result.domain);
            }, 2000);

          } catch (err: any) {
            setError(err.message);
            setStep('results');
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled.');
            setStep('results');
          }
        }
      });

      razorpay.open();

    } catch (err: any) {
      setError(err.message);
      setStep('results');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Purchase New Domain</h3>
            <p className="text-sm text-stone-500 font-medium mt-1">Get a custom address for your store</p>
          </div>
          {step !== 'purchasing' && step !== 'success' && (
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {(step === 'search' || step === 'results') && (
              <motion.div key="search-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleSearch} className="relative mb-6">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a domain (e.g. mystore)"
                    className="w-full pl-11 pr-32 py-3.5 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />
                  <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-stone-900 text-white font-bold text-sm rounded-lg hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 transition-colors"
                  >
                    Search
                  </button>
                </form>

                {step === 'results' && results.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Available Domains</h4>
                    {results.map((result) => (
                      <div key={result.domain} className={`flex items-center justify-between p-4 rounded-xl border ${result.available ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-100 opacity-70'}`}>
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-900 text-lg flex items-center gap-2">
                            {result.domain}
                            {result.available ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Available</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">Taken</span>
                            )}
                          </span>
                          {result.available && (
                            <span className="text-sm text-stone-500 font-medium mt-0.5">
                              {(result.pricePaise / 100).toLocaleString('en-IN', { style: 'currency', currency: result.currency, maximumFractionDigits: 0 })} / year
                            </span>
                          )}
                        </div>
                        {result.available && (
                          <button
                            onClick={() => handleBuy(result)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm active:scale-95 transition-all"
                          >
                            Buy Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {step === 'results' && results.length === 0 && !error && (
                  <div className="text-center py-10 text-stone-500 font-medium">
                    No domains found for "{query}". Try a different name.
                  </div>
                )}
              </motion.div>
            )}

            {step === 'searching' && (
              <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300 mb-4" />
                <p className="font-medium">Searching for best domains...</p>
              </motion.div>
            )}

            {step === 'purchasing' && (
              <motion.div key="purchasing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                  <Loader2 className="w-12 h-12 animate-spin text-emerald-600 relative z-10" />
                </div>
                <h4 className="text-xl font-bold text-stone-900 mb-2">Processing Purchase</h4>
                <p className="text-stone-500 font-medium text-center max-w-xs">{loadingMsg}</p>
                <div className="mt-8 flex gap-4 text-xs font-semibold text-stone-400">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Secure Payment</span>
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Auto DNS Setup</span>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-2xl font-extrabold text-stone-900 mb-3">Domain Registered!</h4>
                <p className="text-stone-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Your new domain is successfully registered, DNS configured, and SSL is provisioned.
                </p>
                <p className="text-sm font-bold text-emerald-600 mt-6 bg-emerald-50 px-4 py-2 rounded-lg">
                  Redirecting to store setup...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
