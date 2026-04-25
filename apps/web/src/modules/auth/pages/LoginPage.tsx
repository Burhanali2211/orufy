import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Lock, AlertCircle, ShieldCheck, Globe, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';

const inputClass =
  'w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-[24px] px-8 py-5 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#6344F5] focus:border-transparent transition-all duration-500 placeholder:text-gray-400';

const labelClass = 'block text-sm font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-4 ml-2 opacity-60';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden selection:bg-[#6344F5]/30">
      {/* Left Side: Visual Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] relative flex-col justify-between p-16 overflow-hidden">
        {/* Animated Background Elements */}
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
            The future of <br />
            <span className="text-[#6344F5]">commerce</span> is here.
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-md leading-relaxed">
            Join thousands of world-class brands building high-fidelity storefronts on Orufy.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 grid grid-cols-2 gap-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Secure</p>
              <p className="text-white/40 text-sm">Enterprise Grade</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Fast</p>
              <p className="text-white/40 text-sm">99.9% Uptime</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 bg-[#FCFBF7] flex flex-col items-center justify-center p-8 md:p-24 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </Link>

          <div className="mb-12">
            <h2 className="text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Sign in.</h2>
            <p className="text-lg text-[#666666] font-medium leading-relaxed">
              Welcome back. Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-5 mb-8 flex items-center gap-4 font-bold shadow-sm"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="space-y-2">
              <label className={labelClass}>Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={20} />
                <input
                  type="email"
                  className={`${inputClass} pl-16`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Password</label>
                <Link to="/forgot-password" className="text-sm font-black text-[#6344F5] hover:text-[#1A1A1A] transition-colors mb-4 mr-2">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pl-16 pr-14`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#6344F5] hover:bg-[#6344F5]/5 rounded-full transition-all focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group mt-12 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-lg text-[#666666] font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#6344F5] font-black hover:underline underline-offset-8">
                Create one for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


