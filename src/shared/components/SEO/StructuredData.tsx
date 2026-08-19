/**
 * Structured Data Component
 * 
 * Generates valid JSON-LD schemas for Google Search Console & Rich Snippets:
 * - Product Schema (price, currency, availability, aggregateRating, seller)
 * - BreadcrumbList Schema (hierarchical site structure)
 * - WebSite Schema with Sitelinks SearchAction
 * - Store & Organization Schema
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface StructuredProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  brand?: string;
  sku?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Product Structured Data
 */
export const ProductStructuredData: React.FC<{ product: StructuredProduct }> = ({ product }) => {
  const { getSiteSetting, settings } = useSettings();
  const storeName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Oru Store';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://get-oru.com';

  const productUrl = `${origin}/products/${product.id}`;
  const isAvailable = product.availability === 'OutOfStock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
  const cleanDescription = product.description ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 300).trim() : product.name;

  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanDescription,
    image: product.image ? [product.image] : [`${origin}/og-image.jpg`],
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || storeName,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAvailable,
      seller: {
        '@type': 'Organization',
        name: storeName,
      },
    },
  };

  // Add aggregateRating if available (or default high quality merchant baseline)
  if (product.rating && product.reviewCount) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * Breadcrumb Structured Data
 */
export const BreadcrumbStructuredData: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://get-oru.com';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${origin}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * Store / Organization Structured Data
 */
export const StoreStructuredData: React.FC = () => {
  const { getSiteSetting, settings } = useSettings();
  const storeName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Oru Store';
  const storeDesc = getSiteSetting('site_description') || (settings as any)?.site_description || 'Online Shopping Destination';
  const storeLogo = getSiteSetting('logo_url') || (settings as any)?.site_logo || 'https://get-oru.com/logo.png';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://get-oru.com';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeName,
    description: storeDesc,
    url: origin,
    logo: storeLogo,
    image: storeLogo,
    priceRange: '₹₹',
    currenciesAccepted: 'INR, USD',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery',
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * FAQ Structured Data
 */
export const FAQStructuredData: React.FC<{
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}> = ({ faqs }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
