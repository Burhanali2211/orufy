import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Sparkles } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Changelog', path: '/changelog' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-[#FCFBF7]/90 backdrop-blur-xl py-4 border-b border-[#E5E1D8] shadow-sm' 
        : 'bg-transparent py-6 border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white group-hover:bg-[#6344F5] transition-all duration-500 shadow-xl shadow-black/5 group-hover:rotate-6">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
          </Link>
        </motion.div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link, idx) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link 
                to={link.path} 
                className="text-[13px] font-black text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-all duration-300 uppercase tracking-[0.2em] relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6344F5] transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-6"
        >
          <div className="hidden md:block">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] hover:bg-[#6344F5] transition-all duration-500 shadow-2xl shadow-black/5 hover:scale-105 active:scale-95"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-8">
                <Link to="/login" className="text-[13px] font-black text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors uppercase tracking-[0.15em]">
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] hover:bg-[#6344F5] transition-all duration-500 shadow-2xl shadow-black/5 hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2.5 text-[#1A1A1A] bg-white border border-[#E5E1D8] rounded-xl shadow-sm hover:border-[#6344F5] transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute top-full left-0 w-full bg-white border-b border-[#E5E1D8] overflow-hidden shadow-3xl"
          >
            <div className="p-8 flex flex-col gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  to={link.path} 
                  className="text-2xl font-black text-[#1A1A1A] tracking-tight hover:text-[#6344F5] transition-colors" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                {user ? (
                  <Link 
                    to="/dashboard" 
                    className="bg-[#1A1A1A] text-white px-8 py-5 rounded-2xl text-center font-black text-lg shadow-xl shadow-black/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="bg-[#FAF9F6] text-[#1A1A1A] border border-[#E5E1D8] px-8 py-5 rounded-2xl text-center font-black text-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/signup" 
                      className="bg-[#6344F5] text-white px-8 py-5 rounded-2xl text-center font-black text-lg shadow-xl shadow-[#6344F5]/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;


