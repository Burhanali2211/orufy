import React from 'react';
import { FileText, BarChart3, Clock, Download, ChevronRight } from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';

export const SellerReportsPage: React.FC = () => {
  return (
    <SellerDashboardLayout 
      title="Advanced Reports" 
      subtitle="Comprehensive data analysis and export tools"
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full -ml-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mb-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
              Intelligence Reports Under Construction
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed mb-10">
              We're building a powerful engine to give you deep insights into your business performance. You'll soon be able to generate custom sales, inventory, and customer reports.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
              {[
                { title: 'Sales Summary', desc: 'Detailed revenue & profit analysis', icon: BarChart3 },
                { title: 'Inventory Velocity', desc: 'Track stock movement trends', icon: Clock },
                { title: 'Export Data', desc: 'CSV & PDF formats supported', icon: Download }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all duration-300">
                  <item.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-3 transition-colors" />
                  <h4 className="text-slate-900 font-black text-sm mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-xs font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            <button className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 group">
              Get Notified When Ready
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerReportsPage;
