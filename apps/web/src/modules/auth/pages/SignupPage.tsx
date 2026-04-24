import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Lock, Store, User, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const slugify = (str: string) =>
  str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

interface FormState {
  name: string;
  email: string;
  shopName: string;
  password: string;
  confirmPassword: string;
}

const inputClass =
  'w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-[24px] px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#6344F5] focus:border-transparent transition-all duration-500 placeholder:text-gray-400';

const labelClass = 'block text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-2 ml-2 opacity-60';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    shopName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const slug = slugify(form.shopName);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = (): string => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.shopName.trim()) return 'Shop name is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const msg = validate();
    if (msg) { setError(msg); return; }

    setLoading(true);
    try {
      await signUp(form.email, form.password, { name: form.name, shopName: form.shopName });
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
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
            Build your <br />
            <span className="text-[#6344F5]">legacy</span> today.
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-sm leading-relaxed">
            The all-in-one platform for modern commerce teams. 14-day free trial included.
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
            <p className="text-white font-bold">Bank-grade security</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <p className="text-white font-bold">Lightning fast deployments</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-7/12 bg-[#FCFBF7] flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[600px]"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Join Orufy.</h2>
            <p className="text-lg text-[#666666] font-medium leading-relaxed">
              Create your account and launch your storefront in minutes.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4 mb-6 flex items-center gap-4 font-bold"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Full Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={18} />
                  <input
                    type="text"
                    className={`${inputClass} pl-14 py-4`}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={18} />
                  <input
                    type="email"
                    className={`${inputClass} pl-14 py-4`}
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Shop Name</label>
              <div className="relative group">
                <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={18} />
                <input
                  type="text"
                  className={`${inputClass} pl-14 py-4`}
                  placeholder="My Awesome Store"
                  value={form.shopName}
                  onChange={set('shopName')}
                  disabled={loading}
                />
              </div>
              {slug && (
                <p className="text-xs text-[#6344F5] font-black mt-2 ml-2 uppercase tracking-wider">
                  Store URL: <span className="text-[#1A1A1A]">{slug}.orufy.com</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={18} />
                  <input
                    type="password"
                    className={`${inputClass} pl-14 py-4`}
                    placeholder="Min 8 chars"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Confirm</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={18} />
                  <input
                    type="password"
                    className={`${inputClass} pl-14 py-4`}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group mt-8 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Creating Account...' : 'Get Started for Free'}
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-lg text-[#666666] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#6344F5] font-black hover:underline underline-offset-8">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-8 text-xs text-[#999999] font-bold text-center leading-relaxed max-w-sm mx-auto uppercase tracking-wider opacity-60">
            By signing up, you agree to our <a href="#" className="text-[#1A1A1A] underline underline-offset-2">Terms</a> and <a href="#" className="text-[#1A1A1A] underline underline-offset-2">Privacy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}


