import React from 'react';
import { SellerDashboardLayout } from '../seller/Layout/SellerDashboardLayout';
import { DomainCard } from '../components/DomainCard';
import { Globe, ShieldCheck, Zap } from 'lucide-react';

export const DomainPage: React.FC = () => {
  return (
    <SellerDashboardLayout 
      title="Domain Settings" 
      subtitle="Manage your store's web address and custom domains"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Intro Card */}
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center border border-blue-100 shadow-inner flex-shrink-0">
              <Globe className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Store Address</h2>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Choose how customers find your store. You can use your free Orufy subdomain or connect a custom domain you already own.
              </p>
            </div>
          </div>
          
          {/* Decorative background flare */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl" />
        </div>

        {/* Domain Management Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 lg:p-10">
            <DomainCard />
          </div>
        </div>

        {/* Help/Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">What is a subdomain?</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              A subdomain is your free Orufy URL (e.g., yourstore.orufy.com). It works instantly and includes a free SSL certificate.
            </p>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">Custom Domains</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Connecting your own domain helps build brand trust. You'll need to update your DNS settings to point to our servers.
            </p>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default DomainPage;

