import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Sparkles, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resendVerification } = useAuth();
  const email = (location.state as any)?.email as string | undefined;

  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await resendVerification(email);
      setResent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden selection:bg-[#6344F5]/30">
      {/* Left Side: Visual Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#1A1A1A] relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6344F5]/20 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#6344F5]/10 rounded-full blur-[80px] -ml-24 -mb-24" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3 group mb-16">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#6344F5] group-hover:text-white transition-all duration-500 shadow-2xl group-hover:rotate-6">
              <Sparkles size={26} fill="currentColor" />
            </div>
            <span className="font-black text-4xl tracking-tighter text-white">Orufy</span>
          </Link>

          <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
            Check your <br />
            <span className="text-[#6344F5]">inbox</span> now.
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-sm leading-relaxed">
            We've sent a secure link to verify your account and get you started.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <p className="text-white font-bold">Email verification security</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <p className="text-white font-bold">Anti-spam protection</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Message */}
      <div className="w-full lg:w-7/12 bg-[#FCFBF7] flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[480px] text-center"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </Link>

          <div className="w-24 h-24 bg-[#6344F5]/10 rounded-[32px] flex items-center justify-center text-[#6344F5] mx-auto mb-10 shadow-inner group">
            <Mail size={48} className="group-hover:scale-110 transition-transform duration-500" />
          </div>

          <h2 className="text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Verify email.</h2>
          <p className="text-xl text-[#666666] font-medium mb-12 leading-relaxed">
            We've sent a verification link to <br />
            <span className="font-black text-[#1A1A1A] underline decoration-[#E5E1D8] underline-offset-4">{email || 'your inbox'}</span>.
          </p>

          <div className="space-y-4 mb-12">
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full bg-[#6344F5] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#1A1A1A] transition-all duration-500 shadow-2xl shadow-[#6344F5]/20 flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98]"
            >
              Verify & Continue to Onboarding
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            {!resent && email && (
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full bg-[#FAF9F6] text-[#1A1A1A] border border-[#E5E1D8] py-6 rounded-[28px] font-black text-lg hover:border-[#1A1A1A] transition-all duration-500 flex items-center justify-center gap-3"
              >
                {loading ? 'Resending Link...' : 'Resend Verification Link'}
              </button>
            )}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4 mb-8 flex items-center gap-4 font-bold text-left"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          {resent && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-100 text-green-600 text-lg rounded-[24px] py-6 px-8 mb-12 flex items-center gap-4 font-black justify-center shadow-sm"
            >
              <CheckCircle2 size={24} />
              Link resent successfully!
            </motion.div>
          )}

          <div className="space-y-6">
            <p className="text-lg text-[#666666] font-medium">
              Verified?{' '}
              <Link to="/onboarding" className="text-[#6344F5] font-black hover:underline underline-offset-8">
                Continue to Plan Selection
              </Link>
            </p>
            
            <p className="text-xs text-[#999999] font-bold uppercase tracking-[0.2em] opacity-40 max-w-xs mx-auto leading-relaxed">
              Didn't get the email? Check your spam folder or try resending.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


