import express from 'express';
import { query } from '../../db/connection';

const router = express.Router();

// Helper: normalize setting values (especially image URLs)
const withNormalizedValue = (row: any) => {
  if (!row) return row;

  try {
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.API_BASE_URL ||
      (process.env.NODE_ENV === 'development'
        ? `http://localhost:${process.env.PORT || 5000}`
        : undefined);

    let settingValue = row.setting_value;

    // Handle null or undefined values
    if (settingValue == null) {
      return {
        ...row,
        setting_value: settingValue,
      };
    }

    // If the setting value is a relative uploads path, convert to absolute URL
    if (
      typeof settingValue === 'string' &&
      settingValue.startsWith('/uploads') &&
      !settingValue.startsWith('http') &&
      baseUrl
    ) {
      // Remove trailing slash from baseUrl and ensure path starts with /
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const cleanPath = settingValue.startsWith('/') ? settingValue : `/${settingValue}`;
      settingValue = `${cleanBaseUrl}${cleanPath}`;
    }

    return {
      ...row,
      setting_value: settingValue,
    };
  } catch (error: any) {
    console.error('Error in withNormalizedValue:', error, row);
    // Return row as-is if normalization fails
    return row;
  }
};

// ============================================
// PUBLIC SITE SETTINGS ROUTES
// ============================================

// Get all public site settings
router.get('/site-settings', async (req, res) => {
  try {
    console.log('Fetching public site settings');
    
    const result = await query(
      `SELECT setting_key, setting_value, setting_type, category, description 
       FROM site_settings 
       WHERE is_public = true 
       ORDER BY category, setting_key`
    );

    console.log('Public site settings result:', result.rows.length, 'rows');

    res.json({
      success: true,
      data: result.rows.map(withNormalizedValue)
    });
  } catch (error: any) {
    console.error('Error fetching public site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public site settings',
      error: error.message
    });
  }
});

// Get public site setting by key
router.get('/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await query(
      `SELECT setting_key, setting_value, setting_type, category, description 
       FROM site_settings 
       WHERE setting_key = $1 AND is_public = true`,
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Public setting not found'
      });
    }

    res.json({
      success: true,
      data: withNormalizedValue(result.rows[0])
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public setting',
      error: error.message
    });
  }
});

// Get all public social media accounts
router.get('/social-media', async (req, res) => {
  try {
    const result = await query(
      `SELECT platform, platform_name, url, username, icon_name, follower_count, description
       FROM social_media_accounts 
       WHERE is_active = true 
       ORDER BY display_order, platform`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public social media accounts',
      error: error.message
    });
  }
});

// Get all public contact information
router.get('/contact-info', async (req, res) => {
  try {
    const result = await query(
      `SELECT contact_type, label, value, is_primary, icon_name, additional_info
       FROM contact_information 
       WHERE is_active = true 
       ORDER BY display_order, contact_type`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public contact information',
      error: error.message
    });
  }
});

// Get all public footer links
router.get('/footer-links', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, section_name, link_text, link_url, opens_new_tab
       FROM footer_links
       WHERE is_active = true
       ORDER BY section_name, display_order`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public footer links',
      error: error.message
    });
  }
});

// Get business hours
router.get('/business-hours', async (req, res) => {
  try {
    const result = await query(
      `SELECT day_of_week, is_open, open_time, close_time, is_24_hours, notes
       FROM business_hours 
       ORDER BY day_of_week`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business hours',
      error: error.message
    });
  }
});

// ============================================
// COMBINED ENDPOINT - Get all public settings in one request
// ============================================
// This endpoint combines all public settings into a single response
// to reduce network requests and improve performance
router.get('/', async (req, res) => {
  try {
    console.log('Fetching combined public settings...');
    
    // Helper function to safely execute a query (for optional tables)
    const safeQuery = async (queryFn: () => Promise<any>, defaultValue: any = { rows: [] }) => {
      try {
        const result = await queryFn();
        return result;
      } catch (err: any) {
        console.error('Query error (non-critical):', err.message);
        return defaultValue;
      }
    };
    
    // Fetch all settings in parallel for optimal performance
    // Site settings is critical, others are optional
    const [
      siteSettingsResult,
      socialMediaResult,
      contactInfoResult,
      footerLinksResult,
      businessHoursResult
    ] = await Promise.all([
      // Site settings is critical - let it throw if it fails
      query(
        `SELECT setting_key, setting_value, setting_type, category, description 
         FROM site_settings 
         WHERE is_public = true 
         ORDER BY category, setting_key`
      ),
      // Other tables are optional - use safeQuery
      safeQuery(
        () => query(
          `SELECT platform, platform_name, url, username, icon_name, follower_count, description
           FROM social_media_accounts 
           WHERE is_active = true 
           ORDER BY display_order, platform`
        )
      ),
      safeQuery(
        () => query(
          `SELECT contact_type, label, value, is_primary, icon_name, additional_info
           FROM contact_information 
           WHERE is_active = true 
           ORDER BY display_order, contact_type`
        )
      ),
      safeQuery(
        () => query(
          `SELECT id, section_name, link_text, link_url, opens_new_tab
           FROM footer_links
           WHERE is_active = true
           ORDER BY section_name, display_order`
        )
      ),
      safeQuery(
        () => query(
          `SELECT day_of_week, is_open, open_time, close_time, is_24_hours, notes
           FROM business_hours 
           ORDER BY day_of_week`
        )
      )
    ]);
    
    // Ensure all results have rows arrays
    const siteSettingsRows = siteSettingsResult?.rows || [];
    const socialMediaRows = socialMediaResult?.rows || [];
    const contactInfoRows = contactInfoResult?.rows || [];
    const footerLinksRows = footerLinksResult?.rows || [];
    const businessHoursRows = businessHoursResult?.rows || [];
    
    console.log('Settings fetched:', {
      siteSettings: siteSettingsRows.length,
      socialMedia: socialMediaRows.length,
      contactInfo: contactInfoRows.length,
      footerLinks: footerLinksRows.length,
      businessHours: businessHoursRows.length
    });

    // Safely map site settings with error handling
    let normalizedSiteSettings = [];
    try {
      normalizedSiteSettings = siteSettingsRows.map((row: any) => {
        try {
          return withNormalizedValue(row);
        } catch (err: any) {
          console.error('Error normalizing setting value:', err, row);
          // Return row as-is if normalization fails
          return row;
        }
      });
    } catch (err: any) {
      console.error('Error mapping site settings:', err);
      normalizedSiteSettings = siteSettingsRows;
    }

    res.json({
      success: true,
      data: {
        siteSettings: normalizedSiteSettings,
        socialMedia: socialMediaRows,
        contactInfo: contactInfoRows,
        footerLinks: footerLinksRows,
        businessHours: businessHoursRows
      }
    });
  } catch (error: any) {
    console.error('Error fetching combined public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public settings',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;