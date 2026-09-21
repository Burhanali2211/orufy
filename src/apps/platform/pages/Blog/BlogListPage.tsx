import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/shared/components/SEO/SEO';
import { BLOG_POSTS } from '../../data/blogs';
import { Store, ChevronRight } from 'lucide-react';

export const BlogListPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased pb-24">
      <SEO
        title="Oru Blog - Learn How to Sell Online in Kashmir"
        description="Read easy guides on how to start your online store, sell dry fruits, and grow your e-commerce business in Kashmir with Oru."
        keywords="ecommerce blog Kashmir, start business Kashmir, sell online Kashmir, Oru blog"
        url="https://get-oru.com/blog"
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#FBFBFD]/85 backdrop-blur-xl border-b border-black/[0.05]">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-lg bg-[#09090B] text-white flex items-center justify-center shadow-xs">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[15px] text-[#09090B]">Orufy</span>
          </Link>
          <div className="flex items-center gap-3">
             <Link
                to="/onboarding"
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full shadow-xs inline-flex items-center gap-1"
              >
                <span>Launch Store</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
          </div>
        </div>
      </header>

      <main className="pt-28 max-w-[1160px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <h1 className="text-[40px] sm:text-[56px] font-semibold tracking-[-0.04em] text-[#09090B] mb-4">
            Oru Business Blog
          </h1>
          <p className="text-[17px] text-[#86868B] max-w-2xl mx-auto">
            Simple guides to help you start and grow your online business in Kashmir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-3xl border border-black/[0.08] overflow-hidden hover:shadow-md transition-all block"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-stone-100">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 text-[12px] text-[#86868B] font-medium mb-3">
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-[22px] font-semibold text-[#09090B] leading-tight mb-3 group-hover:text-[#0071E3] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[14px] text-[#86868B] line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BlogListPage;
