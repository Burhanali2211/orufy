/**
 * SEO Component
 * 
 * Manages meta tags, Open Graph, Twitter Cards, and canonical URLs
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

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

const DEFAULT_TITLE = 'Orufy – Artisan Handmade Woven Bags & Organic Craft Store';
const DEFAULT_DESCRIPTION = 'Shop handmade woven bags, artisan baskets, hand woolen purses and organic craft at Orufy. Sustainable, eco-friendly goods crafted by local artisans. Free shipping on orders above ₹999. India & worldwide delivery.';
const DEFAULT_IMAGE = 'https://orufy.com/og-image.jpg';
const DEFAULT_URL = 'https://orufy.com';
const SITE_NAME = 'Orufy';

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
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = image || DEFAULT_IMAGE;
  const pageUrl = url || DEFAULT_URL;
  const canonicalUrl = canonical || pageUrl;

  // Robots meta tag
  const robotsContent = noindex || nofollow
    ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
    : 'index, follow';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
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
      <meta property="og:site_name" content={SITE_NAME} />
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
}> = ({ productName, description, price, image, category, availability }) => {
  const title = `${productName} - Buy Online`;
  const desc = `${description.substring(0, 150)}... Price: ₹${price}. ${availability === 'InStock' ? 'In Stock' : 'Out of Stock'}. Orufy – Free shipping on orders above ₹999.`;
  const keywords = `${productName}, ${category || 'attar'}, aligarh attar, buy ${productName} online, orufy`;

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
  const title = `${categoryName} - Aligarh Attar House`;
  const desc = description || `Browse premium ${categoryName.toLowerCase()} at Aligarh Attar House. ${productCount ? `${productCount} products available.` : ''} Authentic attars & Islamic lifestyle products. Free shipping on orders above ₹499.`;
  const keywords = `${categoryName}, aligarh attar house, buy ${categoryName} online, ${categoryName} shop, attar perfume`;

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


