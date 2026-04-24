import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Sparkles,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Trophy,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '../../marketing/components/Pricing';

type OnboardingStep = 'plan' | 'payment' | 'provisioning' | 'success';

const STEPS = [
  { id: 'plan', label: 'Plan', icon: Trophy },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'provisioning', label: 'Store Setup', icon: Zap },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('plan');
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [provisioningProgress, setProvisioningProgress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');

  const handlePlanSelect = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePaymentSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('provisioning');
    }, 2000);
  };

  useEffect(() => {
    if (step === 'provisioning') {
      setProvisioningProgress(0);
      const interval = setInterval(() => {
        setProvisioningProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('success'), 500);
            return 100;
          }
          return prev + 4;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [step]);

  const stepIndex = step === 'plan' ? 0 : step === 'payment' ? 1 : step === 'provisioning' ? 2 : 3;

  return (
    <div className="h-screen w-full bg-[#FCFBF7] flex flex-col overflow-hidden selection:bg-[#6344F5]/20">
      {/* ── Header ── */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-[#E5E1D8] bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} fill="currentColor" />
          </div>
          <span className="font-black text-lg tracking-tighter text-[#1A1A1A]">Orufy</span>
        </div>

        {/* Step progress */}
        <div className="hidden sm:flex items-center gap-3">
          {STEPS.map((s, idx) => {
            const isCompleted = stepIndex > idx;
            const isActive = stepIndex === idx;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-400 ${
                    isCompleted ? 'bg-green-500 text-white' 
                    : isActive ? 'bg-[#6344F5] text-white shadow-lg shadow-[#6344F5]/30 scale-110' 
                    : 'bg-[#F0EDE8] text-[#999] border border-[#E5E1D8]'
                  }`}>
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${
                    isActive || isCompleted ? 'text-[#1A1A1A]' : 'text-[#BBBBBB]'
                  }`}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className="w-6 h-px bg-[#E5E1D8]" />}
              </React.Fragment>
            );
          })}
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-[#BBBBBB]">
          {step !== 'success' ? `${stepIndex + 1} / 3` : 'Done ✓'}
        </span>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Plan Selection ── */}
          {step === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col px-6 py-6 max-w-5xl mx-auto w-full"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Choose your plan</h1>
                <p className="text-sm text-[#888] font-medium mt-1">Start free for 14 days. Cancel anytime.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                {PLANS.map((plan, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlanSelect(plan)}
                    className={`relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col text-left bg-white group ${
                      plan.highlighted
                        ? 'border-[#6344F5] shadow-xl shadow-[#6344F5]/10'
                        : 'border-[#E5E1D8] hover:border-[#1A1A1A]'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6344F5] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6344F5] mb-2">{plan.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{plan.price}</span>
                        <span className="text-sm text-[#888] font-bold">{plan.period}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 flex-1 mb-5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm font-semibold text-[#444]">
                          <Check size={12} className="text-[#6344F5] shrink-0" strokeWidth={3} />
                          {f}
                        </div>
                      ))}
                    </div>

                    <div className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-[#6344F5] text-white group-hover:bg-[#1A1A1A]'
                        : 'bg-[#1A1A1A] text-white group-hover:bg-[#6344F5]'
                    }`}>
                      Select Plan
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center px-6 py-6"
            >
              <div className="w-full max-w-md">
                {/* Back */}
                <button
                  onClick={() => setStep('plan')}
                  className="flex items-center gap-1.5 text-sm font-black text-[#888] hover:text-[#1A1A1A] transition-colors mb-5 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Change plan
                </button>

                <div className="bg-white rounded-[32px] p-8 border border-[#E5E1D8] shadow-xl shadow-black/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#6344F5]/5 rounded-full blur-3xl -mr-20 -mt-20" />

                  <div className="relative z-10">
                    {/* Order summary */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Secure Checkout</h2>
                        <p className="text-xs text-[#888] font-medium mt-0.5">{selectedPlan?.name} plan · {selectedPlan?.price}/mo</p>
                      </div>
                      <div className="w-12 h-12 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#6344F5]">
                        <CreditCard size={22} />
                      </div>
                    </div>

                    {/* Amount due */}
                    <div className="bg-[#FAFAF8] rounded-2xl p-4 mb-6 border border-[#E5E1D8] flex justify-between items-center">
                      <span className="text-sm font-bold text-[#666]">Amount Due</span>
                      <span className="text-2xl font-black text-[#6344F5]">{selectedPlan?.price}</span>
                    </div>

                    {/* Payment method */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#BBB] mb-3">Payment Method</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          paymentMethod === 'upi' ? 'border-[#6344F5] bg-[#6344F5]/5' : 'border-[#E5E1D8] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <Smartphone size={20} className={paymentMethod === 'upi' ? 'text-[#6344F5]' : 'text-[#1A1A1A]'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'upi' ? 'text-[#6344F5]' : 'text-[#1A1A1A]'}`}>UPI / GPay</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          paymentMethod === 'card' ? 'border-[#6344F5] bg-[#6344F5]/5' : 'border-[#E5E1D8] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <CreditCard size={20} className={paymentMethod === 'card' ? 'text-[#6344F5]' : 'text-[#1A1A1A]'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'card' ? 'text-[#6344F5]' : 'text-[#1A1A1A]'}`}>Card</span>
                      </button>
                    </div>

                    <button
                      onClick={handlePaymentSubmit}
                      disabled={isProcessing}
                      className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-black text-base hover:bg-[#6344F5] disabled:opacity-50 transition-all duration-400 shadow-lg flex items-center justify-center gap-2.5 group"
                    >
                      {isProcessing ? (
                        <><Loader2 className="animate-spin" size={18} /> Processing...</>
                      ) : (
                        <><ShieldCheck size={18} /> Complete Secure Payment <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-[#BBB] font-bold mt-4">
                      🔒 PCI-DSS Secure · Powered by Razorpay
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Provisioning ── */}
          {step === 'provisioning' && (
            <motion.div
              key="provisioning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col items-center justify-center px-6 py-6 text-center"
            >
              {/* Animated icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-[#6344F5]/10 rounded-3xl flex items-center justify-center text-[#6344F5]">
                  <Zap size={38} fill="currentColor" className="animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1A1A1A] rounded-full animate-spin-slow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2">Setting up your store</h2>
              <p className="text-sm text-[#888] font-medium mb-8 max-w-xs">
                Configuring your isolated database, subdomain, and SSL in seconds.
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-sm mb-2">
                <div className="h-2 bg-[#E5E1D8] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#6344F5] to-[#8B6EFF] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${provisioningProgress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
              </div>
              <div className="flex justify-between w-full max-w-sm mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6344F5]">Provisioning</span>
                <span className="text-[10px] font-black text-[#1A1A1A]">{provisioningProgress}%</span>
              </div>

              {/* Task checklist */}
              <div className="space-y-2.5 w-full max-w-sm">
                {[
                  { label: 'Subdomain creation', done: provisioningProgress > 30 },
                  { label: 'Database isolation', done: provisioningProgress > 60 },
                  { label: 'SSL provisioning', done: provisioningProgress > 85 },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-[#E5E1D8]">
                    {task.done ? (
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    ) : (
                      <Loader2 size={16} className="text-[#6344F5] animate-spin shrink-0" />
                    )}
                    <span className={`text-sm font-bold ${task.done ? 'text-[#1A1A1A]' : 'text-[#AAA]'}`}>{task.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col items-center justify-center px-6 py-6 text-center"
            >
              <motion.div
                initial={{ rotate: -12, scale: 0.8 }}
                animate={{ rotate: 6, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="w-16 h-16 bg-green-500 text-white rounded-[20px] flex items-center justify-center mb-6 shadow-xl shadow-green-500/25"
              >
                <Check size={32} strokeWidth={3.5} />
              </motion.div>

              <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight mb-2">Your store is live!</h1>
              <p className="text-sm text-[#888] font-medium mb-8 max-w-xs leading-relaxed">
                Your Orufy store has been provisioned and is ready for business. A welcome email is on its way.
              </p>

              {/* Action cards */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-5 bg-[#1A1A1A] rounded-3xl text-left group hover:bg-[#6344F5] transition-colors duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6344F5]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Owner Dashboard</p>
                  <p className="text-sm font-black text-white mb-3 leading-snug">Manage your store</p>
                  <div className="flex items-center gap-1 text-[#6344F5] group-hover:text-white transition-colors">
                    <span className="text-xs font-black">Enter</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                <a
                  href="https://demo-store.orufy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 bg-white border-2 border-[#E5E1D8] rounded-3xl text-left group hover:border-[#6344F5] transition-colors duration-300"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#BBB] mb-2">Live Store</p>
                  <p className="text-sm font-black text-[#1A1A1A] mb-3 leading-snug">View storefront</p>
                  <div className="flex items-center gap-1 text-[#6344F5]">
                    <span className="text-xs font-black">Visit</span>
                    <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-[#6344F5]/5 rounded-xl border border-[#6344F5]/15 max-w-sm">
                <ShieldCheck size={14} className="text-[#6344F5] shrink-0" />
                <p className="text-[11px] text-[#6344F5] font-bold text-left leading-relaxed">
                  Welcome email sent with your store link and setup guide.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 py-3 border-t border-[#E5E1D8] bg-white/60 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#CCCCCC]">
          Orufy Cloud · Secure Auto-Provisioning Engine
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
      `}} />
    </div>
  );
}
