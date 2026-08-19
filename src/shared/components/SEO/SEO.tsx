/**
 * SEO Component
 * 
 * Manages dynamic meta tags, Open Graph, Twitter Cards, and canonical URLs
 * with full multi-tenant and Google Search Console compliance.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
  nofollow = false,
  canonical
}) => {
  const { getSiteSetting, settings } = useSettings();

  const storeName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Oru Store';
  const storeDesc = getSiteSetting('site_description') || (settings as any)?.site_description || 'Shop premium curated products with fast tracked delivery and secure checkout.';
  const storeKeywords = getSiteSetting('site_keywords') || (settings as any)?.site_keywords || 'online store, buy online, premium products, fast shipping, secure payment';
  const storeLogo = getSiteSetting('logo_url') || (settings as any)?.site_logo || 'https://get-oru.com/og-image.jpg';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://get-oru.com';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const pageTitle = title ? `${title} — ${storeName}` : `${storeName} – Premium Online Store`;
  const pageDescription = description || storeDesc;
  const pageImage = image || storeLogo;
  const pageUrl = url || `${origin}${pathname}`;
  const canonicalUrl = canonical || pageUrl;
  const combinedKeywords = keywords ? `${keywords}, ${storeKeywords}` : storeKeywords;

  // Robots meta tag
  const robotsContent = noindex || nofollow
    ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={combinedKeywords} />
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robotsContent} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={storeName} />
      <meta property="og:locale" content="en_IN" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />
    </Helmet>
  );
};

/**
 * Product SEO Component
 */
export const ProductSEO: React.FC<{
  productName: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  availability?: string;
  sku?: string;
}> = ({ productName, description, price, image, category, availability, sku }) => {
  const { getSiteSetting, settings } = useSettings();
  const storeName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Store';

  const title = `${productName} – Buy Online at Best Price`;
  const cleanDesc = description ? description.replace(/<[^>]*>?/gm, '').substring(0, 160).trim() : '';
  const desc = `${cleanDesc} | Price: ₹${price}. ${availability === 'InStock' ? 'In Stock & Ready to Ship' : 'Available Online'}. Authentic quality, secure payment & fast delivery from ${storeName}.`;
  const keywords = `${productName}, buy ${productName} online, ${category || 'products'}, ${storeName}, best price, order online`;

  return (
    <SEO
      title={title}
      description={desc}
      keywords={keywords}
      image={image}
      type="product"
    />
  );
};

/**
 * Category SEO Component
 */
export const CategorySEO: React.FC<{
  categoryName: string;
  description?: string;
  productCount?: number;
}> = ({ categoryName, description, productCount }) => {
  const { getSiteSetting, settings } = useSettings();
  const storeName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Store';

  const title = `${categoryName} – Shop Collection`;
  const desc = description || `Explore our curated selection of ${categoryName.toLowerCase()} at ${storeName}. ${productCount ? `Browse ${productCount}+ authentic products.` : ''} Fast tracked shipping and secure payment across India & worldwide.`;
  const keywords = `${categoryName}, buy ${categoryName} online, ${categoryName} collection, ${storeName}, shopping`;

  return (
    <SEO
      title={title}
      description={desc}
      keywords={keywords}
      type="website"
    />
  );
};

/**
 * Blog Post SEO Component
 */
export const BlogPostSEO: React.FC<{
  title: string;
  description: string;
  image?: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
}> = ({ title, description, image, author, publishedDate, modifiedDate }) => {
  return (
    <SEO
      title={title}
      description={description}
      image={image}
      type="article"
      author={author}
      publishedTime={publishedDate}
      modifiedTime={modifiedDate}
    />
  );
};

/**
 * Page SEO Component (for static pages)
 */
export const PageSEO: React.FC<{
  title: string;
  description: string;
  noindex?: boolean;
}> = ({ title, description, noindex }) => {
  return (
    <SEO
      title={title}
      description={description}
      type="website"
      noindex={noindex}
    />
  );
};
