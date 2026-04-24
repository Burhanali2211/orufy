import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const inputClass =
  'w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-[24px] px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#6344F5] focus:border-transparent transition-all duration-500 placeholder:text-gray-400';

const labelClass = 'block text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-2 ml-2 opacity-60';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
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
            Access <br />
            <span className="text-[#6344F5]">restored</span> easily.
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-sm leading-relaxed">
            Secure, fast, and simple. Get back to building your commerce empire.
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
            <p className="text-white font-bold">Encrypted recovery tokens</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <p className="text-white font-bold">Instant delivery</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Form / Success */}
      <div className="w-full lg:w-7/12 bg-[#FCFBF7] flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[480px]"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </Link>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-[#6344F5]/10 rounded-[32px] flex items-center justify-center text-[#6344F5] mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-black text-[#1A1A1A] mb-4 tracking-tight">Check your inbox.</h2>
              <p className="text-lg text-[#666666] font-medium mb-12 leading-relaxed">
                We've sent a recovery link to <br />
                <span className="font-black text-[#1A1A1A] underline decoration-[#E5E1D8] underline-offset-4">{email}</span>
              </p>
              
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-3 bg-[#1A1A1A] text-white px-10 py-5 rounded-[24px] font-black text-lg hover:bg-[#6344F5] transition-all duration-500 shadow-2xl shadow-black/10 group"
              >
                Back to Sign In
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Recover.</h2>
                <p className="text-lg text-[#666666] font-medium leading-relaxed">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4 mb-8 flex items-center gap-4 font-bold"
                >
                  <AlertCircle size={20} />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="space-y-2">
                  <label className={labelClass}>Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={20} />
                    <input
                      type="email"
                      className={`${inputClass} pl-14 py-5`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group mt-10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Sending link...' : 'Send Recovery Link'}
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-12 text-center">
                <Link to="/login" className="text-lg text-[#666666] font-medium hover:text-[#1A1A1A] transition-colors">
                  Actually, I remember it. <span className="text-[#6344F5] font-black hover:underline underline-offset-8">Sign in</span>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}


