import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../../contexts/SettingsContext';
import { normalizeImageUrl } from '../../utils/images';

/**
 * MetaManager handles dynamic SEO metadata using react-helmet-async
 * It automatically updates the document title, meta description, and favicon
 */
export const MetaManager: React.FC = () => {
  const { getSiteSetting, loading } = useSettings();

  if (loading) return null;

  const siteName = getSiteSetting('site_name') || 'YourCommerce';
  const siteDescription = getSiteSetting('site_description') || 'Pure Attars, Oud & Premium Fragrances';
  const faviconUrl = normalizeImageUrl(getSiteSetting('favicon_url'));

  return (
    <Helmet>
      <title>{siteName}</title>
      <meta name="description" content={siteDescription} />

      {faviconUrl && (
        <link rel="shortcut icon" href={faviconUrl} />
      )}

      {/* Dynamic Open Graph Tags */}
      <meta property="og:title" content={siteName} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:type" content="website" />

      {/* Dynamic Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteName} />
      <meta name="twitter:description" content={siteDescription} />
    </Helmet>
  );
};

export default MetaManager;

