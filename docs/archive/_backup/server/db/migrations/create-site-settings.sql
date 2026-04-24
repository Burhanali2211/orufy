-- Site Settings Tables
-- Tables for managing site configuration, social media, and contact information

-- 1. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
  category VARCHAR(50) DEFAULT 'general', -- general, email, security, payment
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- whether this setting can be accessed publicly
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL, -- facebook, instagram, twitter, youtube, linkedin, pinterest, tiktok
  platform_name VARCHAR(100) NOT NULL, -- Display name
  url TEXT NOT NULL,
  username VARCHAR(100),
  icon_name VARCHAR(50), -- lucide icon name
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contact Information Table
CREATE TABLE IF NOT EXISTS contact_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type VARCHAR(50) NOT NULL, -- phone, email, address, whatsapp, support
  label VARCHAR(100) NOT NULL, -- e.g., "Customer Support", "Sales", "Main Office"
  value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon_name VARCHAR(50), -- lucide icon name
  additional_info JSONB, -- for storing extra data like business hours, department, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Business Hours Table
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  is_24_hours BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week)
);

-- 5. Footer Links Table
CREATE TABLE IF NOT EXISTS footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name VARCHAR(100) NOT NULL, -- e.g., "Shop", "Customer Care", "Company"
  link_text VARCHAR(100) NOT NULL,
  link_url VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  opens_new_tab BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_social_media_active ON social_media_accounts(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_contact_info_type ON contact_information(contact_type, is_active);
CREATE INDEX IF NOT EXISTS idx_footer_links_section ON footer_links(section_name, display_order);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then add new ones
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
DROP TRIGGER IF EXISTS update_social_media_updated_at ON social_media_accounts;
DROP TRIGGER IF EXISTS update_contact_info_updated_at ON contact_information;
DROP TRIGGER IF EXISTS update_business_hours_updated_at ON business_hours;
DROP TRIGGER IF EXISTS update_footer_links_updated_at ON footer_links;

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_updated_at BEFORE UPDATE ON social_media_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_footer_links_updated_at BEFORE UPDATE ON footer_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
  ('site_name', 'Perfume Paradise', 'text', 'general', 'Website name', true),
  ('site_tagline', 'Discover Your Signature Scent', 'text', 'general', 'Website tagline', true),
  ('site_description', 'Premium perfumes and attars from around the world', 'text', 'general', 'Website description', true),
  ('support_email', 'support@perfumeparadise.com', 'text', 'contact', 'Support email address', true),
  ('sales_email', 'sales@perfumeparadise.com', 'text', 'contact', 'Sales email address', true),
  ('copyright_text', '© 2024 Perfume Paradise. All rights reserved.', 'text', 'general', 'Copyright text', true),
  ('currency', 'USD', 'text', 'general', 'Default currency', true),
  ('currency_symbol', '$', 'text', 'general', 'Currency symbol', true),
  ('tax_rate', '0.10', 'number', 'general', 'Tax rate (10%)', false),
  ('free_shipping_threshold', '50', 'number', 'general', 'Free shipping above this amount', true),
  ('logo_url', '/src/assets/images/logo.png', 'text', 'design', 'Website logo URL', true),
  ('primary_color', '#7e22ce', 'text', 'design', 'Primary color for the website', true),
  ('secondary_color', '#8b5cf6', 'text', 'design', 'Secondary color for the website', true),
  ('accent_color', '#a855f7', 'text', 'design', 'Accent color for the website', true),
  ('cart_button_text', 'Add to Cart', 'text', 'design', 'Text for the add to cart button', true),
  ('cart_button_color', '#7e22ce', 'text', 'design', 'Background color for the add to cart button', true),
  ('cart_button_text_color', '#ffffff', 'text', 'design', 'Text color for the add to cart button', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample social media accounts
INSERT INTO social_media_accounts (platform, platform_name, url, username, icon_name, is_active, display_order, follower_count) VALUES
  ('facebook', 'Facebook', 'https://facebook.com/perfumeparadise', '@perfumeparadise', 'Facebook', true, 1, 15000),
  ('instagram', 'Instagram', 'https://instagram.com/perfumeparadise', '@perfumeparadise', 'Instagram', true, 2, 25000),
  ('twitter', 'Twitter', 'https://twitter.com/perfumeparadise', '@perfumeparadise', 'Twitter', true, 3, 8000),
  ('youtube', 'YouTube', 'https://youtube.com/@perfumeparadise', '@perfumeparadise', 'Youtube', true, 4, 12000),
  ('pinterest', 'Pinterest', 'https://pinterest.com/perfumeparadise', '@perfumeparadise', 'Pin', true, 5, 5000),
  ('tiktok', 'TikTok', 'https://tiktok.com/@perfumeparadise', '@perfumeparadise', 'Music', true, 6, 30000)
ON CONFLICT DO NOTHING;

-- Insert sample contact information
INSERT INTO contact_information (contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info) VALUES
  ('phone', 'Customer Support', '+1 (555) 123-4567', true, true, 1, 'Phone', '{"department": "support", "hours": "Mon-Fri 9AM-6PM"}'),
  ('phone', 'Sales Inquiries', '+1 (555) 123-4568', false, true, 2, 'Phone', '{"department": "sales", "hours": "Mon-Fri 9AM-6PM"}'),
  ('email', 'General Inquiries', 'info@perfumeparadise.com', true, true, 3, 'Mail', '{"department": "general"}'),
  ('email', 'Customer Support', 'support@perfumeparadise.com', false, true, 4, 'Mail', '{"department": "support"}'),
  ('whatsapp', 'WhatsApp Support', '+1 (555) 123-4567', false, true, 5, 'MessageCircle', '{"department": "support"}'),
  ('address', 'Main Office', '123 Fragrance Street, New York, NY 10001, USA', true, true, 6, 'MapPin', '{"type": "office", "country": "USA"}'),
  ('address', 'Warehouse', '456 Scent Avenue, Los Angeles, CA 90001, USA', false, true, 7, 'MapPin', '{"type": "warehouse", "country": "USA"}')
ON CONFLICT DO NOTHING;

-- Insert business hours (Monday to Sunday)
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time, is_24_hours, notes) VALUES
  (0, false, NULL, NULL, false, 'Closed on Sundays'),
  (1, true, '09:00', '18:00', false, 'Monday'),
  (2, true, '09:00', '18:00', false, 'Tuesday'),
  (3, true, '09:00', '18:00', false, 'Wednesday'),
  (4, true, '09:00', '18:00', false, 'Thursday'),
  (5, true, '09:00', '18:00', false, 'Friday'),
  (6, true, '10:00', '16:00', false, 'Saturday - Reduced hours')
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert footer links
INSERT INTO footer_links (section_name, link_text, link_url, display_order, is_active) VALUES
  -- Shop Section
  ('Shop', 'All Products', '/products', 1, true),
  ('Shop', 'New Arrivals', '/new-arrivals', 2, true),
  ('Shop', 'Best Sellers', '/best-sellers', 3, true),
  ('Shop', 'Special Offers', '/deals', 4, true),
  ('Shop', 'Gift Cards', '/gift-cards', 5, true),
  
  -- Customer Care Section
  ('Customer Care', 'Contact Us', '/contact', 1, true),
  ('Customer Care', 'Track Order', '/track-order', 2, true),
  ('Customer Care', 'Returns & Refunds', '/returns', 3, true),
  ('Customer Care', 'Shipping Info', '/shipping', 4, true),
  ('Customer Care', 'FAQ', '/faq', 5, true),
  
  -- Company Section
  ('Company', 'About Us', '/about', 1, true),
  ('Company', 'Our Story', '/story', 2, true),
  ('Company', 'Careers', '/careers', 3, true),
  ('Company', 'Press', '/press', 4, true),
  ('Company', 'Blog', '/blog', 5, true),
  
  -- Legal Section
  ('Legal', 'Privacy Policy', '/privacy', 1, true),
  ('Legal', 'Terms of Service', '/terms', 2, true),
  ('Legal', 'Cookie Policy', '/cookies', 3, true),
  ('Legal', 'Sitemap', '/sitemap', 4, true)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your RLS policies)
-- GRANT SELECT ON site_settings TO authenticated;
-- GRANT ALL ON site_settings TO service_role;
-- GRANT SELECT ON social_media_accounts TO authenticated;
-- GRANT ALL ON social_media_accounts TO service_role;
-- GRANT SELECT ON contact_information TO authenticated;
-- GRANT ALL ON contact_information TO service_role;
-- GRANT SELECT ON business_hours TO authenticated;
-- GRANT ALL ON business_hours TO service_role;
-- GRANT SELECT ON footer_links TO authenticated;
-- GRANT ALL ON footer_links TO service_role;

COMMENT ON TABLE site_settings IS 'General site configuration settings';
COMMENT ON TABLE social_media_accounts IS 'Social media platform links and information';
COMMENT ON TABLE contact_information IS 'Contact details including phone, email, and addresses';
COMMENT ON TABLE business_hours IS 'Business operating hours for each day of the week';
COMMENT ON TABLE footer_links IS 'Links displayed in the website footer';