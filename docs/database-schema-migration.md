# Database Schema Migration Guide

## Overview
This document provides detailed instructions for creating the PostgreSQL database schema that matches the existing Supabase implementation for the Sufi Essences e-commerce platform.

## Schema Creation Order
To maintain referential integrity, create tables in the following order:
1. Core reference tables (profiles, categories)
2. Main entity tables (products, orders)
3. Supporting relationship tables (product_variants, order_items)
4. User-related tables (addresses, payment_methods, cart_items, wishlist_items)
5. System tables (reviews, inventory_transactions, user_preferences, user_security_settings)

## Table Definitions

### 1. Profiles Table
```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'seller', 'customer')) DEFAULT 'customer',
  phone TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
```

### 2. Categories Table
```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at);
```

### 3. Products Table
```sql
-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  images TEXT[],
  stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  sku TEXT UNIQUE,
  weight DECIMAL(8, 3),
  dimensions JSONB,
  tags TEXT[],
  specifications JSONB,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON public.products USING GIN(to_tsvector('english', description));
```

### 4. Product Variants Table
```sql
-- Create product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_created_at ON public.product_variants(created_at);
```

### 5. Orders Table
```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON public.orders(guest_email);
```

### 6. Order Items Table
```sql
-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  product_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);
```

### 7. Cart Items Table
```sql
-- Create cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cart items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON public.cart_items(created_at);
```

### 8. Wishlist Items Table
```sql
-- Create wishlist items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for wishlist items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON public.wishlist_items(created_at);
```

### 9. Reviews Table
```sql
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
```

### 10. Addresses Table
```sql
-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('shipping', 'billing')) DEFAULT 'shipping',
  full_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IN',
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON public.addresses(created_at);
```

### 11. Payment Methods Table
```sql
-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('credit', 'debit', 'paypal', 'bank_account')) NOT NULL,
  provider TEXT NOT NULL,
  last_four TEXT NOT NULL,
  expiry_month INTEGER,
  expiry_year INTEGER,
  holder_name TEXT NOT NULL,
  billing_address_id UUID REFERENCES public.addresses(id),
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  encrypted_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_created_at ON public.payment_methods(created_at);
```

### 12. Inventory Transactions Table
```sql
-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('in', 'out', 'adjustment')) NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for inventory transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant_id ON public.inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_by ON public.inventory_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);
```

### 13. Low Stock Alerts Table
```sql
-- Create low stock alerts table
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  min_stock_level INTEGER NOT NULL,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for low stock alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON public.low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant_id ON public.low_stock_alerts(variant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_alert_sent ON public.low_stock_alerts(alert_sent);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_created_at ON public.low_stock_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved_at ON public.low_stock_alerts(resolved_at);
```

### 14. User Preferences Table
```sql
-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_order_updates BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT false,
  email_security BOOLEAN DEFAULT true,
  email_product_updates BOOLEAN DEFAULT false,
  push_order_updates BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_newsletter BOOLEAN DEFAULT false,
  push_security BOOLEAN DEFAULT true,
  push_product_updates BOOLEAN DEFAULT false,
  sms_order_updates BOOLEAN DEFAULT false,
  sms_promotions BOOLEAN DEFAULT false,
  sms_newsletter BOOLEAN DEFAULT false,
  sms_security BOOLEAN DEFAULT true,
  sms_product_updates BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for user preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_created_at ON public.user_preferences(created_at);
```

### 15. User Security Settings Table
```sql
-- Create user security settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method TEXT CHECK (two_factor_method IN ('email', 'sms', 'authenticator')) DEFAULT 'email',
  two_factor_phone TEXT,
  two_factor_backup_codes TEXT[],
  login_alerts BOOLEAN DEFAULT true,
  suspicious_activity_alerts BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 30,
  require_password_for_sensitive_actions BOOLEAN DEFAULT true,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for user security settings
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON public.user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_created_at ON public.user_security_settings(created_at);
```

## Triggers and Functions

### Update Timestamp Trigger Function
```sql
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables that need updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### Category Slug Generation Function
```sql
-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(category_name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set slug if not provided
CREATE OR REPLACE FUNCTION public.set_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_category_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category slug generation
CREATE TRIGGER set_category_slug_trigger
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_category_slug();
```

### Product Slug Generation Function
```sql
-- Function to automatically set slug if not provided
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product slug generation
CREATE TRIGGER set_product_slug_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug();
```

### Cart Item Price Calculation Function
```sql
-- Function to calculate cart item total price
CREATE OR REPLACE FUNCTION public.calculate_cart_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current price of the product/variant
  IF NEW.variant_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN pv.price_adjustment != 0 THEN p.price + pv.price_adjustment
        ELSE p.price
      END
    INTO NEW.unit_price
    FROM public.products p
    JOIN public.product_variants pv ON pv.id = NEW.variant_id
    WHERE p.id = NEW.product_id AND pv.id = NEW.variant_id;
  ELSE
    SELECT price INTO NEW.unit_price FROM public.products WHERE id = NEW.product_id;
  END IF;
  
  -- Calculate total price
  NEW.total_price := NEW.unit_price * NEW.quantity;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart item price calculation
CREATE TRIGGER calculate_cart_item_total_trigger
  BEFORE INSERT OR UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_cart_item_total();
```

### Review Helpful Count Function
```sql
-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;
```

## Views

### Category Statistics View
```sql
-- Create a view for category statistics
CREATE OR REPLACE VIEW public.category_stats AS
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(p.id) as product_count,
  AVG(p.price) as average_price,
  MAX(p.created_at) as last_product_added
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug;
```

### Product Statistics View
```sql
-- Create a view for product statistics
CREATE OR REPLACE VIEW public.product_stats AS
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.name as category_name,
  p.seller_id,
  pr.full_name as seller_name,
  p.price,
  p.stock,
  p.rating,
  p.review_count,
  p.is_featured,
  p.created_at
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.profiles pr ON p.seller_id = pr.id
WHERE p.is_active = true;
```

### Cart Statistics View
```sql
-- Create a view for cart statistics
CREATE OR REPLACE VIEW public.cart_stats AS
SELECT 
  user_id,
  COUNT(*) as item_count,
  SUM(quantity) as total_quantity,
  SUM(total_price) as cart_total
FROM public.cart_items
GROUP BY user_id;
```

### Order Statistics View
```sql
-- Create a view for order statistics
CREATE OR REPLACE VIEW public.order_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as order_date,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM public.orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY order_date DESC;
```

### Order Details View
```sql
-- Create a view for order details
CREATE OR REPLACE VIEW public.order_details AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  o.status,
  o.payment_status,
  o.total_amount,
  o.created_at,
  p.full_name as customer_name,
  p.email as customer_email
FROM public.orders o
LEFT JOIN public.profiles p ON o.user_id = p.id;
```

### Current Inventory View
```sql
-- Create a view for current inventory levels
CREATE OR REPLACE VIEW public.current_inventory AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.stock as product_stock,
  p.min_stock_level,
  CASE 
    WHEN p.stock <= p.min_stock_level THEN 'low' 
    WHEN p.stock <= p.min_stock_level * 2 THEN 'medium' 
    ELSE 'good' 
  END as stock_status,
  p.seller_id,
  pr.full_name as seller_name
FROM public.products p
LEFT JOIN public.profiles pr ON p.seller_id = pr.id
WHERE p.is_active = true;
```

## Permissions

### Grant Permissions to Application User
```sql
-- Grant permissions for profiles
GRANT SELECT ON public.profiles TO app_user;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO app_user;

-- Grant permissions for categories
GRANT SELECT ON public.categories TO app_user;
GRANT INSERT, UPDATE, DELETE ON public.categories TO app_user;

-- Grant permissions for products
GRANT SELECT ON public.products TO app_user;
GRANT INSERT, UPDATE, DELETE ON public.products TO app_user;

-- Grant permissions for product variants
GRANT SELECT ON public.product_variants TO app_user;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO app_user;

-- Grant permissions for orders
GRANT SELECT, INSERT, UPDATE ON public.orders TO app_user;
GRANT DELETE ON public.orders TO app_user;

-- Grant permissions for order items
GRANT SELECT, INSERT ON public.order_items TO app_user;
GRANT DELETE ON public.order_items TO app_user;

-- Grant permissions for cart items
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO app_user;

-- Grant permissions for wishlist items
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO app_user;

-- Grant permissions for reviews
GRANT SELECT ON public.reviews TO app_user;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO app_user;

-- Grant permissions for addresses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO app_user;

-- Grant permissions for payment methods
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO app_user;

-- Grant permissions for inventory transactions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transactions TO app_user;

-- Grant permissions for low stock alerts
GRANT SELECT, UPDATE, DELETE ON public.low_stock_alerts TO app_user;

-- Grant permissions for user preferences
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO app_user;

-- Grant permissions for user security settings
GRANT SELECT, INSERT, UPDATE ON public.user_security_settings TO app_user;

-- Grant permissions on views
GRANT SELECT ON public.category_stats TO app_user;
GRANT SELECT ON public.product_stats TO app_user;
GRANT SELECT ON public.cart_stats TO app_user;
GRANT SELECT ON public.order_stats TO app_user;
GRANT SELECT ON public.order_details TO app_user;
GRANT SELECT ON public.current_inventory TO app_user;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO app_user;
GRANT EXECUTE ON FUNCTION public.generate_category_slug(TEXT) TO app_user;
GRANT EXECUTE ON FUNCTION public.set_category_slug() TO app_user;
GRANT EXECUTE ON FUNCTION public.set_product_slug() TO app_user;
GRANT EXECUTE ON FUNCTION public.calculate_cart_item_total() TO app_user;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(UUID) TO app_user;
```

## Validation Queries

### Verify Schema Creation
```sql
-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check that all indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check that all views were created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check that all functions were created
SELECT proname, prokind
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname;
```

This comprehensive schema migration guide ensures that all database objects from the Supabase implementation are properly recreated in PostgreSQL, maintaining data integrity and functionality for the Sufi Essences e-commerce platform.