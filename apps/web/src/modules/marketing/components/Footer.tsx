import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FAF9F6] pt-24 pb-12 border-t border-[#E5E1D8]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
                <Layers size={22} />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-[#1A1A1A]">Orufy</span>
            </Link>
            <p className="text-gray-500 max-w-sm text-lg leading-relaxed mb-8">
              The ultimate infrastructure for high-performance e-commerce teams. Build, scale, and dominate with Orufy.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-gray-400 hover:text-[#6344F5] hover:border-[#6344F5] transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-gray-400 hover:text-[#6344F5] hover:border-[#6344F5] transition-all">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-[#E5E1D8] flex items-center justify-center text-gray-400 hover:text-[#6344F5] hover:border-[#6344F5] transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-[#1A1A1A] uppercase tracking-widest text-xs mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/features" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Pricing</Link></li>
              <li><Link to="/power-ups" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Power-ups</Link></li>
              <li><Link to="/changelog" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Changelog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-[#1A1A1A] uppercase tracking-widest text-xs mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">About</Link></li>
              <li><Link to="/blog" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Blog</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Contact</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium">Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-[#E5E1D8] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-gray-400 font-medium">
            <span>© {currentYear} Orufy Group.</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50/50 rounded-full border border-green-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">All Systems Operational</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium italic">
            Built for those who build.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

