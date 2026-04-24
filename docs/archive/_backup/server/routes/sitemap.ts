/**
 * Sitemap Routes
 * 
 * Serves XML sitemap for search engines
 */

import express, { Request, Response } from 'express';
import { generateSitemap } from '../services/sitemapService';

const router = express.Router();

/**
 * Get sitemap.xml
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    // Get base URL from environment or request
    const baseUrl = process.env.FRONTEND_URL || 
                    process.env.VITE_APP_URL || 
                    `${req.protocol}://${req.get('host')}`;

    // Generate sitemap
    const sitemap = await generateSitemap(baseUrl);

    // Set headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;

