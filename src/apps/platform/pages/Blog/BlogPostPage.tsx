import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEO } from '@/shared/components/SEO/SEO';
import { BLOG_POSTS } from '../data/blogs';
import { Store, ChevronRight, ArrowLeft } from 'lucide-react';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased pb-24">
      <SEO
        title={`${post.title} | Oru Blog`}
        description={post.excerpt}
        keywords={post.seoKeywords}
        url={`https://get-oru.com/blog/${post.slug}`}
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

      <main className="pt-28 max-w-[800px] mx-auto px-5 sm:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#86868B] hover:text-[#09090B] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </Link>

        <article>
          <header className="mb-10">
            <h1 className="text-[32px] sm:text-[44px] font-semibold tracking-[-0.03em] text-[#09090B] leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-[#86868B] font-medium">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[#09090B] font-bold">
                  {post.author.charAt(0)}
                </div>
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <span>{new Date(post.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <div className="aspect-[16/9] w-full rounded-[24px] overflow-hidden mb-12 bg-stone-100 border border-black/[0.04]">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <div 
            className="prose prose-stone prose-lg max-w-none text-[#1D1D1F] leading-relaxed 
                       prose-h2:text-[24px] prose-h2:font-semibold prose-h2:text-[#09090B] prose-h2:mt-10 prose-h2:mb-4
                       prose-p:mb-6 prose-p:text-[16px]
                       prose-a:text-[#0071E3] prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* CTA section at bottom of blog post */}
        <div className="mt-20 p-10 bg-[#09090B] rounded-[32px] text-center text-white">
          <h3 className="text-[24px] font-semibold mb-3">Ready to start?</h3>
          <p className="text-[#A1A1A6] mb-8 max-w-md mx-auto">Create your own online store in less than a minute and start getting direct payments.</p>
          <Link
            to="/onboarding"
            className="bg-white text-[#09090B] text-[15px] font-semibold px-8 py-3.5 rounded-full inline-block hover:bg-stone-200 transition-colors"
          >
            Create Your Free Store Now
          </Link>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;
