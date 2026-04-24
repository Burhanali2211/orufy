import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowLeft, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

type PageState = 'loading' | 'ready' | 'success' | 'invalid';

const inputClass =
  'w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-[24px] px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#6344F5] focus:border-transparent transition-all duration-500 placeholder:text-gray-400';

const labelClass = 'block text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-2 ml-2 opacity-60';

const ResetPasswordPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updatePassword } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (token) {
      setPageState('ready');
    } else {
      const timer = setTimeout(() => {
        setPageState(prev => prev === 'loading' ? 'invalid' : prev);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      setPageState('invalid');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password, token);
      setPageState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      showNotification({ type: 'error', title: 'Error', message: msg });
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
            Security <br />
            <span className="text-[#6344F5]">first</span> always.
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-sm leading-relaxed">
            Create a strong, unique password to keep your commerce operations secure.
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
            <p className="text-white font-bold">SHA-256 Encryption</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Zap size={24} />
            </div>
            <p className="text-white font-bold">Secure Session Guard</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side: States */}
      <div className="w-full lg:w-7/12 bg-[#FCFBF7] flex flex-col items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[480px]"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </div>

          <AnimatePresence mode="wait">
            {pageState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-[#6344F5]/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#6344F5] rounded-full border-t-transparent animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Verifying link...</h2>
                <p className="text-[#666666] font-medium mt-3">Securing your session.</p>
              </motion.div>
            )}

            {pageState === 'invalid' && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500 mx-auto mb-8 shadow-sm">
                  <AlertCircle size={48} />
                </div>
                <h2 className="text-4xl font-black text-[#1A1A1A] mb-4 tracking-tight">Link expired.</h2>
                <p className="text-lg text-[#666666] font-medium mb-10 leading-relaxed">
                  This reset link is invalid or has already been used.
                </p>
                <Link
                  to="/forgot-password"
                  className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group"
                >
                  Request New Link
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            )}

            {pageState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-green-50 rounded-[32px] flex items-center justify-center text-green-600 mx-auto mb-8 shadow-sm">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-4xl font-black text-[#1A1A1A] mb-4 tracking-tight">Access restored.</h2>
                <p className="text-lg text-[#666666] font-medium mb-10 leading-relaxed">
                  Your password has been successfully updated.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group"
                >
                  Sign In to Dashboard
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {pageState === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-12">
                  <h2 className="text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">New password.</h2>
                  <p className="text-lg text-[#666666] font-medium leading-relaxed">
                    Set a strong password to secure your account access.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="space-y-2">
                    <label className={labelClass}>New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputClass} pl-14 pr-14 ${errors.password ? 'border-red-400' : ''}`}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6344F5] transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 font-bold ml-2">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6344F5] transition-colors" size={20} />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={`${inputClass} pl-14 pr-14 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' })); }}
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6344F5] transition-colors">
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 font-bold ml-2">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1A1A1A] text-white py-6 rounded-[28px] font-black text-xl hover:bg-[#6344F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 group mt-10 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-12 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-3 text-[#666666] font-bold hover:text-[#1A1A1A] transition-colors uppercase tracking-[0.2em] text-xs"
                  >
                    <ArrowLeft size={16} /> Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

