import express from 'express';
import { query } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(authorize('admin'));

// ============================================
// SITE SETTINGS ROUTES
// ============================================

// Get all site settings
router.get('/site-settings', async (req, res) => {
  try {
    console.log('Fetching all site settings');
    
    const result = await query(
      `SELECT * FROM site_settings ORDER BY category, setting_key`
    );

    console.log('Site settings result:', result.rows.length, 'rows');

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings',
      error: error.message
    });
  }
});

// Get site setting by key
router.get('/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await query(
      `SELECT * FROM site_settings WHERE setting_key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
});

// Update site setting
router.put('/site-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;
    // Fix: Use userId from the authenticated request instead of user object
    const userId = (req as any).userId;

    console.log('Update site setting request:', { key, setting_value, description, userId });

    // Validate input
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }

    if (setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    // Log the database query
    console.log('Executing database query for key:', key);
    
    // For site settings, the updated_by field is optional
    let result;
    if (userId) {
      result = await query(
        `UPDATE site_settings 
         SET setting_value = $1, description = COALESCE($2, description), updated_by = $3, updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $4
         RETURNING *`,
        [setting_value, description, userId, key]
      );
    } else {
      result = await query(
        `UPDATE site_settings 
         SET setting_value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $3
         RETURNING *`,
        [setting_value, description, key]
      );
    }

    console.log('Database query result:', result);

    if (result.rows.length === 0) {
      console.log('Setting not found for key:', key);
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    console.log('Setting updated successfully:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating site setting:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
});

// Create new site setting
router.post('/site-settings', async (req, res) => {
  try {
    const { setting_key, setting_value, setting_type, category, description, is_public } = req.body;
    // Fix: Use userId from the authenticated request instead of user object
    const userId = (req as any).userId;

    console.log('Creating new site setting:', { setting_key, setting_value, setting_type, category, description, is_public, userId });

    let result;
    if (userId) {
      result = await query(
        `INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [setting_key, setting_value, setting_type || 'text', category || 'general', description, is_public || false, userId]
      );
    } else {
      result = await query(
        `INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [setting_key, setting_value, setting_type || 'text', category || 'general', description, is_public || false]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating site setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setting',
      error: error.message
    });
  }
});

// ============================================
// THEME SETTINGS ROUTES
// ============================================

// Get theme settings
router.get('/theme', async (req, res) => {
  try {
    // Try to get theme settings from site_settings table
    const result = await query(
      `SELECT setting_value FROM site_settings WHERE setting_key = 'theme_settings'`
    );

    let themeData;
    if (result.rows.length > 0 && result.rows[0].setting_value) {
      try {
        // Parse the JSON string if it's a string, otherwise use as-is
        const settingValue = result.rows[0].setting_value;
        if (typeof settingValue === 'string') {
          themeData = JSON.parse(settingValue);
        } else if (typeof settingValue === 'object') {
          themeData = settingValue;
        } else {
          // Invalid format, use defaults
          themeData = null;
        }
      } catch (parseError: any) {
        console.error('Error parsing theme settings JSON:', parseError);
        // If JSON parsing fails, use defaults
        themeData = null;
      }
    }

    // If no valid theme data found, use defaults
    if (!themeData || typeof themeData !== 'object') {
      themeData = {
        mode: 'light',
        colorScheme: 'default',
        primaryColor: '#8b5cf6',
        secondaryColor: '#ec4899',
        accentColor: '#f59e0b',
        fontFamily: 'Inter',
        fontSize: 'medium',
        borderRadius: 'medium',
        animationLevel: 'full'
      };
    }

    res.json({
      success: true,
      data: themeData
    });
  } catch (error: any) {
    console.error('Error fetching theme settings:', error);
    // Return default theme settings even on error, so the page doesn't break
    const defaultTheme = {
      mode: 'light',
      colorScheme: 'default',
      primaryColor: '#8b5cf6',
      secondaryColor: '#ec4899',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      fontSize: 'medium',
      borderRadius: 'medium',
      animationLevel: 'full'
    };
    
    res.json({
      success: true,
      data: defaultTheme,
      message: 'Using default theme settings due to an error'
    });
  }
});

// Update theme settings
router.put('/theme', async (req, res) => {
  try {
    const themeData = req.body;
    const userId = (req as any).userId;

    console.log('Received theme update request:', {
      hasData: !!themeData,
      dataType: typeof themeData,
      userId,
      dataKeys: themeData ? Object.keys(themeData) : []
    });

    // Validate required fields
    if (!themeData || typeof themeData !== 'object') {
      console.error('Invalid theme data provided:', themeData);
      return res.status(400).json({
        success: false,
        message: 'Invalid theme data provided'
      });
    }

    // Validate theme data structure
    const validFields = ['mode', 'colorScheme', 'primaryColor', 'secondaryColor', 'accentColor', 'fontFamily', 'fontSize', 'borderRadius', 'animationLevel'];
    const filteredData: any = {};
    validFields.forEach(field => {
      if (themeData[field] !== undefined) {
        filteredData[field] = themeData[field];
      }
    });

    console.log('Filtered theme data:', filteredData);

    // Convert theme object to JSON string
    const themeJson = JSON.stringify(filteredData);

    // Check if theme_settings exists
    const checkResult = await query(
      `SELECT id FROM site_settings WHERE setting_key = 'theme_settings'`
    );

    console.log('Theme settings exists:', checkResult.rows.length > 0);

    let result;
    if (checkResult.rows.length > 0) {
      // Update existing theme settings
      if (userId) {
        result = await query(
          `UPDATE site_settings
           SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = 'theme_settings'
           RETURNING *`,
          [themeJson, userId]
        );
      } else {
        result = await query(
          `UPDATE site_settings
           SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = 'theme_settings'
           RETURNING *`,
          [themeJson]
        );
      }
      console.log('Theme settings updated:', result.rows.length > 0);
    } else {
      // Insert new theme settings
      if (userId) {
        result = await query(
          `INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public, updated_by)
           VALUES ('theme_settings', $1, 'json', 'design', 'Theme customization settings', true, $2)
           RETURNING *`,
          [themeJson, userId]
        );
      } else {
        result = await query(
          `INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public)
           VALUES ('theme_settings', $1, 'json', 'design', 'Theme customization settings', true)
           RETURNING *`,
          [themeJson]
        );
      }
      console.log('Theme settings inserted:', result.rows.length > 0);
    }

    console.log('Sending success response');
    res.json({
      success: true,
      message: 'Theme settings updated successfully',
      data: filteredData
    });
  } catch (error: any) {
    console.error('Error updating theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme settings',
      error: error.message
    });
  }
});

// ============================================
// SOCIAL MEDIA ROUTES
// ============================================

// Get all social media accounts
router.get('/social-media', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM social_media_accounts ORDER BY display_order, platform`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social media accounts',
      error: error.message
    });
  }
});

// Get single social media account
router.get('/social-media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT * FROM social_media_accounts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Social media account not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social media account',
      error: error.message
    });
  }
});

// Create social media account
router.post('/social-media', async (req, res) => {
  try {
    const { platform, platform_name, url, username, icon_name, is_active, display_order, follower_count, description } = req.body;

    const result = await query(
      `INSERT INTO social_media_accounts (platform, platform_name, url, username, icon_name, is_active, display_order, follower_count, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [platform, platform_name, url, username, icon_name, is_active !== false, display_order || 0, follower_count || 0, description]
    );

    res.status(201).json({
      success: true,
      message: 'Social media account created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create social media account',
      error: error.message
    });
  }
});

// Update social media account
router.put('/social-media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, platform_name, url, username, icon_name, is_active, display_order, follower_count, description } = req.body;

    const result = await query(
      `UPDATE social_media_accounts 
       SET platform = COALESCE($1, platform),
           platform_name = COALESCE($2, platform_name),
           url = COALESCE($3, url),
           username = COALESCE($4, username),
           icon_name = COALESCE($5, icon_name),
           is_active = COALESCE($6, is_active),
           display_order = COALESCE($7, display_order),
           follower_count = COALESCE($8, follower_count),
           description = COALESCE($9, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [platform, platform_name, url, username, icon_name, is_active, display_order, follower_count, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Social media account not found'
      });
    }

    res.json({
      success: true,
      message: 'Social media account updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update social media account',
      error: error.message
    });
  }
});

// Delete social media account
router.delete('/social-media/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM social_media_accounts WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Social media account not found'
      });
    }

    res.json({
      success: true,
      message: 'Social media account deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete social media account',
      error: error.message
    });
  }
});

// Bulk delete social media accounts
router.post('/social-media/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Social media account IDs array is required'
      });
    }

    const result = await query(
      `DELETE FROM social_media_accounts WHERE id = ANY($1) RETURNING id`,
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} social media account(s) deleted successfully`,
      deletedCount: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete social media accounts',
      error: error.message
    });
  }
});

// ============================================
// CONTACT INFORMATION ROUTES
// ============================================

// Get all contact information
router.get('/contact-info', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM contact_information ORDER BY display_order, contact_type`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
      error: error.message
    });
  }
});

// Get single contact info
router.get('/contact-info/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM contact_information WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact information not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
      error: error.message
    });
  }
});

// Create contact information
router.post('/contact-info', async (req, res) => {
  try {
    const { contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info } = req.body;

    const result = await query(
      `INSERT INTO contact_information (contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [contact_type, label, value, is_primary || false, is_active !== false, display_order || 0, icon_name, additional_info]
    );

    res.status(201).json({
      success: true,
      message: 'Contact information created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create contact information',
      error: error.message
    });
  }
});

// Update contact information
router.put('/contact-info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info } = req.body;

    const result = await query(
      `UPDATE contact_information
       SET contact_type = COALESCE($1, contact_type),
           label = COALESCE($2, label),
           value = COALESCE($3, value),
           is_primary = COALESCE($4, is_primary),
           is_active = COALESCE($5, is_active),
           display_order = COALESCE($6, display_order),
           icon_name = COALESCE($7, icon_name),
           additional_info = COALESCE($8, additional_info),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact information not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update contact information',
      error: error.message
    });
  }
});

// Delete contact information
router.delete('/contact-info/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM contact_information WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact information not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact information deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact information',
      error: error.message
    });
  }
});

// Bulk delete contact information
router.post('/contact-info/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact information IDs array is required'
      });
    }

    const result = await query(
      `DELETE FROM contact_information WHERE id = ANY($1) RETURNING id`,
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} contact information entry/entries deleted successfully`,
      deletedCount: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact information',
      error: error.message
    });
  }
});

// ============================================
// BUSINESS HOURS ROUTES
// ============================================

// Get all business hours
router.get('/business-hours', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM business_hours ORDER BY day_of_week`
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

// Update business hours for a specific day
router.put('/business-hours/:day', async (req, res) => {
  try {
    const { day } = req.params;
    const { is_open, open_time, close_time, is_24_hours, notes } = req.body;

    const result = await query(
      `UPDATE business_hours
       SET is_open = COALESCE($1, is_open),
           open_time = $2,
           close_time = $3,
           is_24_hours = COALESCE($4, is_24_hours),
           notes = COALESCE($5, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE day_of_week = $6
       RETURNING *`,
      [is_open, open_time, close_time, is_24_hours, notes, day]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business hours not found for this day'
      });
    }

    res.json({
      success: true,
      message: 'Business hours updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update business hours',
      error: error.message
    });
  }
});

// ============================================
// FOOTER LINKS ROUTES
// ============================================

// Get all footer links
router.get('/footer-links', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM footer_links ORDER BY section_name, display_order`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch footer links',
      error: error.message
    });
  }
});

// Create footer link
router.post('/footer-links', async (req, res) => {
  try {
    const { section_name, link_text, link_url, display_order, is_active, opens_new_tab } = req.body;

    const result = await query(
      `INSERT INTO footer_links (section_name, link_text, link_url, display_order, is_active, opens_new_tab)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [section_name, link_text, link_url, display_order || 0, is_active !== false, opens_new_tab || false]
    );

    res.status(201).json({
      success: true,
      message: 'Footer link created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create footer link',
      error: error.message
    });
  }
});

// Update footer link
router.put('/footer-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { section_name, link_text, link_url, display_order, is_active, opens_new_tab } = req.body;

    const result = await query(
      `UPDATE footer_links
       SET section_name = COALESCE($1, section_name),
           link_text = COALESCE($2, link_text),
           link_url = COALESCE($3, link_url),
           display_order = COALESCE($4, display_order),
           is_active = COALESCE($5, is_active),
           opens_new_tab = COALESCE($6, opens_new_tab),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [section_name, link_text, link_url, display_order, is_active, opens_new_tab, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer link not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer link updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update footer link',
      error: error.message
    });
  }
});

// Delete footer link
router.delete('/footer-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM footer_links WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer link not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer link deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete footer link',
      error: error.message
    });
  }
});

// Bulk delete footer links
router.post('/footer-links/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Footer link IDs array is required'
      });
    }

    const result = await query(
      `DELETE FROM footer_links WHERE id = ANY($1) RETURNING id`,
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} footer link(s) deleted successfully`,
      deletedCount: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete footer links',
      error: error.message
    });
  }
});

// ============================================
// ADMIN DASHBOARD SETTINGS ROUTES
// ============================================

// Get all admin dashboard settings
router.get('/dashboard', async (req, res) => {
  try {
    // First verify table exists
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_dashboard_settings'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({
        success: false,
        message: 'Admin dashboard settings table does not exist. Please run database migration.',
        error: 'Table not found'
      });
    }

    const result = await query(
      `SELECT * FROM admin_dashboard_settings WHERE is_active = true ORDER BY category, setting_key`
    );

    // Convert rows to key-value object - return both formats for compatibility
    const settings: Record<string, any> = {};
    const settingsFlat: Record<string, string> = {};
    
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        category: row.category,
        description: row.description,
        is_active: row.is_active
      };
      // Also provide flat format for easier access
      settingsFlat[row.setting_key] = row.setting_value;
    });

    res.json({
      success: true,
      data: settings,
      flat: settingsFlat, // Additional flat format
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard settings',
      error: error.message
    });
  }
});

// Get single admin dashboard setting
router.get('/dashboard/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await query(
      `SELECT * FROM admin_dashboard_settings WHERE setting_key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
});

// Update admin dashboard setting
router.put('/dashboard/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;
    const userId = (req as any).userId;
    
    // updated_by column is now UUID type, so we can use userId directly
    const isValidId = !!userId;

    if (setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    let result;
    if (isValidId) {
      result = await query(
        `UPDATE admin_dashboard_settings 
         SET setting_value = $1, description = COALESCE($2, description), updated_by = $3, updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $4
         RETURNING *`,
        [setting_value, description, userId, key]
      );
    } else {
      result = await query(
        `UPDATE admin_dashboard_settings 
         SET setting_value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $3
         RETURNING *`,
        [setting_value, description, key]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating admin dashboard setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
});

// Bulk update admin dashboard settings
router.put('/dashboard', async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = (req as any).userId;
    
    // updated_by column is now UUID type, so we can use userId directly
    const isValidId = !!userId;

    console.log('Bulk update request received:', {
      hasSettings: !!settings,
      settingsType: typeof settings,
      keysCount: settings ? Object.keys(settings).length : 0,
      userId: userId || 'none',
      isValidId
    });

    if (!settings || typeof settings !== 'object') {
      console.error('Invalid settings object:', settings);
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    // Get all keys to update
    const keys = Object.keys(settings);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No settings provided to update'
      });
    }

    // Update all settings - use UPSERT to handle missing keys
    const updates: any[] = [];
    const errors: string[] = [];

    for (const key of keys) {
      const value = settings[key];
      
      // Validate value is not undefined
      if (value === undefined) {
        console.warn(`Skipping ${key}: value is undefined`);
        continue;
      }

      try {
        let result;
        // Use UPSERT (INSERT ... ON CONFLICT) to handle both update and insert
        if (isValidId) {
          result = await query(
            `INSERT INTO admin_dashboard_settings (setting_key, setting_value, setting_type, category, description, is_active, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (setting_key) 
             DO UPDATE SET 
               setting_value = EXCLUDED.setting_value,
               updated_by = EXCLUDED.updated_by,
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [key, String(value), 'text', 'dashboard', `Admin dashboard setting: ${key}`, true, userId]
          );
        } else {
          result = await query(
            `INSERT INTO admin_dashboard_settings (setting_key, setting_value, setting_type, category, description, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (setting_key) 
             DO UPDATE SET 
               setting_value = EXCLUDED.setting_value,
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [key, String(value), 'text', 'dashboard', `Admin dashboard setting: ${key}`, true]
          );
        }
        
        if (result.rows.length > 0) {
          updates.push(result.rows[0]);
        } else {
          errors.push(`Setting ${key} could not be saved`);
        }
      } catch (updateError: any) {
        console.error(`Error updating setting ${key}:`, updateError);
        console.error(`Error details:`, updateError.stack);
        errors.push(`Failed to update ${key}: ${updateError.message}`);
      }
    }

    if (errors.length > 0 && updates.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        errors: errors,
        error: errors.join('; ')
      });
    }

    res.json({
      success: true,
      message: `${updates.length} setting(s) updated successfully${errors.length > 0 ? `, ${errors.length} error(s)` : ''}`,
      data: updates,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error bulk updating admin dashboard settings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new admin dashboard setting
router.post('/dashboard', async (req, res) => {
  try {
    const { setting_key, setting_value, setting_type, category, description, is_active } = req.body;
    const userId = (req as any).userId;
    
    // Check if userId is a valid integer (updated_by column is integer type)
    const isValidIntegerId = userId && !isNaN(parseInt(userId)) && isFinite(userId);

    if (!setting_key) {
      return res.status(400).json({
        success: false,
        message: 'Setting key is required'
      });
    }

    let result;
    if (isValidIntegerId) {
      result = await query(
        `INSERT INTO admin_dashboard_settings (setting_key, setting_value, setting_type, category, description, is_active, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [setting_key, setting_value, setting_type || 'text', category || 'dashboard', description, is_active !== false, parseInt(userId)]
      );
    } else {
      result = await query(
        `INSERT INTO admin_dashboard_settings (setting_key, setting_value, setting_type, category, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [setting_key, setting_value, setting_type || 'text', category || 'dashboard', description, is_active !== false]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating admin dashboard setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setting',
      error: error.message
    });
  }
});

export default router;

