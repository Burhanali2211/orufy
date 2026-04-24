# Data Migration Guide: Supabase to PostgreSQL

## Overview
This document provides a comprehensive guide for migrating data from the existing Supabase database to the new PostgreSQL database for the Sufi Essences e-commerce platform. The migration process is designed to ensure zero data loss and minimal downtime.

## Prerequisites
- PostgreSQL database with schema created (as per schema migration guide)
- Supabase database connection details
- Sufficient storage space for data export/import
- Network connectivity between Supabase and PostgreSQL servers

## Migration Strategy

### Approach
The migration will follow a three-phase approach:
1. **Initial Migration**: One-time bulk data transfer
2. **Incremental Sync**: Ongoing synchronization during testing phase
3. **Final Cutover**: Last synchronization before production switch

### Data Transfer Method
We'll use PostgreSQL's `COPY` command for efficient data transfer:
- Export from Supabase using `COPY TO` in CSV format
- Import to PostgreSQL using `COPY FROM` in CSV format

## Migration Steps

### 1. Preparation

#### 1.1 Environment Setup
```bash
# Create directories for data files
mkdir -p /tmp/sufi_essences_migration
cd /tmp/sufi_essences_migration

# Set up environment variables
export SUPABASE_DB_URL="postgresql://user:password@supabase-host:5432/database"
export POSTGRES_DB_URL="postgresql://app_user:password@localhost:5432/sufi_essences"
```

#### 1.2 Validation Queries
Before migration, validate source data:
```sql
-- Check row counts in Supabase
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM auth.users
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as row_count FROM public.categories
UNION ALL
SELECT 'products' as table_name, COUNT(*) as row_count FROM public.products
-- Continue for all tables
ORDER BY table_name;
```

### 2. Data Export from Supabase

#### 2.1 Export Core Tables

**Profiles Table:**
```bash
# Export profiles data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, email, full_name, avatar_url, role, phone, date_of_birth, is_active, email_verified, created_at, updated_at FROM public.profiles) TO 'profiles.csv' WITH CSV HEADER"
```

**Categories Table:**
```bash
# Export categories data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at FROM public.categories) TO 'categories.csv' WITH CSV HEADER"
```

**Products Table:**
```bash
# Export products data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, name, slug, description, short_description, price, original_price, category_id, seller_id, images, stock, min_stock_level, sku, weight, dimensions, tags, specifications, rating, review_count, is_featured, is_active, meta_title, meta_description, created_at, updated_at FROM public.products) TO 'products.csv' WITH CSV HEADER"
```

**Product Variants Table:**
```bash
# Export product variants data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, product_id, name, value, price_adjustment, stock, sku, is_active, created_at, updated_at FROM public.product_variants) TO 'product_variants.csv' WITH CSV HEADER"
```

#### 2.2 Export User-Related Tables

**Orders Table:**
```bash
# Export orders data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, order_number, user_id, guest_email, guest_name, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, status, payment_status, payment_method, payment_id, currency, shipping_address, billing_address, notes, tracking_number, shipped_at, delivered_at, created_at, updated_at FROM public.orders) TO 'orders.csv' WITH CSV HEADER"
```

**Order Items Table:**
```bash
# Export order items data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, order_id, product_id, variant_id, quantity, unit_price, total_price, product_snapshot, created_at FROM public.order_items) TO 'order_items.csv' WITH CSV HEADER"
```

**Addresses Table:**
```bash
# Export addresses data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, user_id, type, full_name, street_address, city, state, postal_code, country, phone, is_default, created_at, updated_at FROM public.addresses) TO 'addresses.csv' WITH CSV HEADER"
```

**Payment Methods Table:**
```bash
# Export payment methods data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, user_id, type, provider, last_four, expiry_month, expiry_year, holder_name, billing_address_id, is_default, is_verified, encrypted_data, created_at, updated_at FROM public.payment_methods) TO 'payment_methods.csv' WITH CSV HEADER"
```

#### 2.3 Export System Tables

**Reviews Table:**
```bash
# Export reviews data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, product_id, user_id, rating, title, comment, is_approved, helpful_count, created_at, updated_at FROM public.reviews) TO 'reviews.csv' WITH CSV HEADER"
```

**Inventory Transactions Table:**
```bash
# Export inventory transactions data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, product_id, variant_id, transaction_type, quantity, reason, reference_type, reference_id, created_by, created_at FROM public.inventory_transactions) TO 'inventory_transactions.csv' WITH CSV HEADER"
```

**User Preferences Table:**
```bash
# Export user preferences data
psql $SUPABASE_DB_URL -c "\COPY (SELECT id, user_id, email_order_updates, email_promotions, email_newsletter, email_security, email_product_updates, push_order_updates, push_promotions, push_newsletter, push_security, push_product_updates, sms_order_updates, sms_promotions, sms_newsletter, sms_security, sms_product_updates, language, timezone, currency, created_at, updated_at FROM public.user_preferences) TO 'user_preferences.csv' WITH CSV HEADER"
```

### 3. Data Import to PostgreSQL

#### 3.1 Import Core Tables

**Profiles Table:**
```bash
# Import profiles data
psql $POSTGRES_DB_URL -c "\COPY public.profiles (id, email, full_name, avatar_url, role, phone, date_of_birth, is_active, email_verified, created_at, updated_at) FROM 'profiles.csv' WITH CSV HEADER"
```

**Categories Table:**
```bash
# Import categories data
psql $POSTGRES_DB_URL -c "\COPY public.categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at) FROM 'categories.csv' WITH CSV HEADER"
```

**Products Table:**
```bash
# Import products data
psql $POSTGRES_DB_URL -c "\COPY public.products (id, name, slug, description, short_description, price, original_price, category_id, seller_id, images, stock, min_stock_level, sku, weight, dimensions, tags, specifications, rating, review_count, is_featured, is_active, meta_title, meta_description, created_at, updated_at) FROM 'products.csv' WITH CSV HEADER"
```

**Product Variants Table:**
```bash
# Import product variants data
psql $POSTGRES_DB_URL -c "\COPY public.product_variants (id, product_id, name, value, price_adjustment, stock, sku, is_active, created_at, updated_at) FROM 'product_variants.csv' WITH CSV HEADER"
```

#### 3.2 Import User-Related Tables

**Orders Table:**
```bash
# Import orders data
psql $POSTGRES_DB_URL -c "\COPY public.orders (id, order_number, user_id, guest_email, guest_name, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, status, payment_status, payment_method, payment_id, currency, shipping_address, billing_address, notes, tracking_number, shipped_at, delivered_at, created_at, updated_at) FROM 'orders.csv' WITH CSV HEADER"
```

**Order Items Table:**
```bash
# Import order items data
psql $POSTGRES_DB_URL -c "\COPY public.order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price, product_snapshot, created_at) FROM 'order_items.csv' WITH CSV HEADER"
```

**Addresses Table:**
```bash
# Import addresses data
psql $POSTGRES_DB_URL -c "\COPY public.addresses (id, user_id, type, full_name, street_address, city, state, postal_code, country, phone, is_default, created_at, updated_at) FROM 'addresses.csv' WITH CSV HEADER"
```

**Payment Methods Table:**
```bash
# Import payment methods data
psql $POSTGRES_DB_URL -c "\COPY public.payment_methods (id, user_id, type, provider, last_four, expiry_month, expiry_year, holder_name, billing_address_id, is_default, is_verified, encrypted_data, created_at, updated_at) FROM 'payment_methods.csv' WITH CSV HEADER"
```

#### 3.3 Import System Tables

**Reviews Table:**
```bash
# Import reviews data
psql $POSTGRES_DB_URL -c "\COPY public.reviews (id, product_id, user_id, rating, title, comment, is_approved, helpful_count, created_at, updated_at) FROM 'reviews.csv' WITH CSV HEADER"
```

**Inventory Transactions Table:**
```bash
# Import inventory transactions data
psql $POSTGRES_DB_URL -c "\COPY public.inventory_transactions (id, product_id, variant_id, transaction_type, quantity, reason, reference_type, reference_id, created_by, created_at) FROM 'inventory_transactions.csv' WITH CSV HEADER"
```

**User Preferences Table:**
```bash
# Import user preferences data
psql $POSTGRES_DB_URL -c "\COPY public.user_preferences (id, user_id, email_order_updates, email_promotions, email_newsletter, email_security, email_product_updates, push_order_updates, push_promotions, push_newsletter, push_security, push_product_updates, sms_order_updates, sms_promotions, sms_newsletter, sms_security, sms_product_updates, language, timezone, currency, created_at, updated_at) FROM 'user_preferences.csv' WITH CSV HEADER"
```

### 4. Data Validation

#### 4.1 Row Count Validation
```sql
-- Compare row counts between source and destination
WITH source_counts AS (
  SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
  UNION ALL
  SELECT 'categories' as table_name, COUNT(*) as row_count FROM public.categories
  UNION ALL
  SELECT 'products' as table_name, COUNT(*) as row_count FROM public.products
  -- Continue for all tables
),
dest_counts AS (
  SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
  UNION ALL
  SELECT 'categories' as table_name, COUNT(*) as row_count FROM public.categories
  UNION ALL
  SELECT 'products' as table_name, COUNT(*) as row_count FROM public.products
  -- Continue for all tables
)
SELECT 
  s.table_name,
  s.row_count as source_count,
  d.row_count as dest_count,
  CASE 
    WHEN s.row_count = d.row_count THEN 'MATCH'
    ELSE 'MISMATCH'
  END as status
FROM source_counts s
JOIN dest_counts d ON s.table_name = d.table_name
ORDER BY s.table_name;
```

#### 4.2 Data Integrity Validation
```sql
-- Check for orphaned records
SELECT COUNT(*) as orphaned_products 
FROM public.products p 
LEFT JOIN public.categories c ON p.category_id = c.id 
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

SELECT COUNT(*) as orphaned_orders 
FROM public.orders o 
LEFT JOIN public.profiles p ON o.user_id = p.id 
WHERE o.user_id IS NOT NULL AND p.id IS NULL;

-- Check for data consistency
SELECT 
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record,
  COUNT(*) as total_records
FROM public.profiles;

-- Validate critical business data
SELECT 
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value
FROM public.orders 
WHERE status NOT IN ('cancelled', 'refunded');
```

### 5. Incremental Sync Setup

#### 5.1 Create Sync Tracking Table
```sql
-- Create table to track last sync timestamps
CREATE TABLE IF NOT EXISTS public.data_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  last_sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  record_count INTEGER,
  sync_status TEXT CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_sync_log_table_name ON public.data_sync_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_last_sync ON public.data_sync_log(last_sync_timestamp);
```

#### 5.2 Incremental Sync Script
Create a script for ongoing synchronization:
```bash
#!/bin/bash
# incremental-sync.sh

# Function to sync a table
sync_table() {
  local table_name=$1
  local timestamp_column=$2
  
  echo "Syncing $table_name..."
  
  # Get last sync timestamp
  last_sync=$(psql $POSTGRES_DB_URL -t -c "SELECT last_sync_timestamp FROM public.data_sync_log WHERE table_name = '$table_name' ORDER BY last_sync_timestamp DESC LIMIT 1;")
  
  if [ -z "$last_sync" ]; then
    last_sync="1970-01-01 00:00:00"
  fi
  
  # Export new/updated records from Supabase
  psql $SUPABASE_DB_URL -c "\COPY (SELECT * FROM public.$table_name WHERE $timestamp_column > '$last_sync') TO '${table_name}_incremental.csv' WITH CSV HEADER"
  
  # Get record count
  record_count=$(wc -l < ${table_name}_incremental.csv)
  record_count=$((record_count - 1)) # Subtract header line
  
  if [ $record_count -gt 0 ]; then
    # Import to PostgreSQL
    psql $POSTGRES_DB_URL -c "\COPY public.$table_name FROM '${table_name}_incremental.csv' WITH CSV HEADER"
    
    echo "Imported $record_count records to $table_name"
  else
    echo "No new records for $table_name"
  fi
  
  # Update sync log
  current_timestamp=$(date -u +"%Y-%m-%d %H:%M:%S")
  psql $POSTGRES_DB_URL -c "INSERT INTO public.data_sync_log (table_name, last_sync_timestamp, record_count, sync_status) VALUES ('$table_name', '$current_timestamp', $record_count, 'completed');"
  
  # Clean up
  rm -f ${table_name}_incremental.csv
}

# Sync all tables
sync_table "profiles" "updated_at"
sync_table "categories" "updated_at"
sync_table "products" "updated_at"
sync_table "orders" "updated_at"
sync_table "reviews" "updated_at"

echo "Incremental sync completed"
```

### 6. Performance Optimization

#### 6.1 Disable Indexes During Import
Before importing large datasets, temporarily disable indexes:
```sql
-- Disable indexes for faster imports
ALTER INDEX idx_profiles_email UNUSABLE;
ALTER INDEX idx_products_category_id UNUSABLE;
-- Continue for all indexes

-- After import, rebuild indexes
REINDEX INDEX idx_profiles_email;
REINDEX INDEX idx_products_category_id;
-- Continue for all indexes
```

#### 6.2 Batch Processing
For very large tables, process in batches:
```bash
# Example for processing large tables in batches
BATCH_SIZE=10000
OFFSET=0

while true; do
  # Export batch from Supabase
  psql $SUPABASE_DB_URL -c "\COPY (SELECT * FROM public.large_table LIMIT $BATCH_SIZE OFFSET $OFFSET) TO 'batch_${OFFSET}.csv' WITH CSV HEADER"
  
  # Check if batch is empty
  record_count=$(wc -l < batch_${OFFSET}.csv)
  record_count=$((record_count - 1)) # Subtract header line
  
  if [ $record_count -eq 0 ]; then
    rm -f batch_${OFFSET}.csv
    break
  fi
  
  # Import batch to PostgreSQL
  psql $POSTGRES_DB_URL -c "\COPY public.large_table FROM 'batch_${OFFSET}.csv' WITH CSV HEADER"
  
  echo "Processed batch starting at offset $OFFSET"
  
  # Clean up and increment offset
  rm -f batch_${OFFSET}.csv
  OFFSET=$((OFFSET + BATCH_SIZE))
done
```

### 7. Error Handling and Recovery

#### 7.1 Common Issues and Solutions

**Issue: Data type mismatch**
- **Solution**: Check column data types and convert if necessary
- **Prevention**: Validate schema before migration

**Issue: Constraint violations**
- **Solution**: Temporarily disable constraints during import
- **Prevention**: Clean data before migration

**Issue: Network timeouts**
- **Solution**: Use smaller batch sizes and retry mechanism
- **Prevention**: Ensure stable network connection

#### 7.2 Rollback Procedures
```sql
-- In case of migration failure, rollback to clean state
-- Disable foreign key checks (PostgreSQL doesn't have this, but you can drop constraints)
ALTER TABLE public.products DROP CONSTRAINT products_category_id_fkey;
-- Continue for all constraints

-- Truncate all tables
TRUNCATE TABLE public.profiles, public.categories, public.products, public.orders RESTART IDENTITY CASCADE;

-- Recreate constraints
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);
-- Continue for all constraints
```

### 8. Monitoring and Logging

#### 8.1 Migration Progress Tracking
```sql
-- Create migration progress tracking
CREATE TABLE IF NOT EXISTS public.migration_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  records_migrated INTEGER,
  total_records INTEGER,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial progress records
INSERT INTO public.migration_progress (table_name, total_records, status, start_time)
SELECT 
  table_name,
  row_count,
  'pending',
  NOW()
FROM (
  SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles_source
  UNION ALL
  SELECT 'categories' as table_name, COUNT(*) as row_count FROM public.categories_source
  -- Continue for all tables
) source_counts;
```

#### 8.2 Performance Monitoring
```bash
# Monitor import performance
time psql $POSTGRES_DB_URL -c "\COPY public.profiles FROM 'profiles.csv' WITH CSV HEADER"

# Monitor system resources during migration
htop &
iostat -x 1 &
```

### 9. Post-Migration Tasks

#### 9.1 Update Sequence Values
After importing data, update sequence values:
```sql
-- Update sequence values for auto-incrementing columns
SELECT setval('public.profiles_id_seq', (SELECT MAX(id) FROM public.profiles));
SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories));
SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));
-- Continue for all tables with serial columns
```

#### 9.2 Rebuild Indexes and Statistics
```sql
-- Rebuild all indexes
REINDEX DATABASE sufi_essences;

-- Update table statistics for query planner
ANALYZE;
```

#### 9.3 Verify Application Functionality
```sql
-- Test critical queries
SELECT * FROM public.products WHERE is_active = true LIMIT 10;
SELECT * FROM public.orders WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 5;
SELECT p.name, c.name as category FROM public.products p JOIN public.categories c ON p.category_id = c.id LIMIT 10;
```

## Migration Timeline

### Phase 1: Initial Migration (1-2 days)
- Environment setup and validation
- Data export from Supabase
- Data import to PostgreSQL
- Initial validation

### Phase 2: Incremental Sync (1 week)
- Set up incremental sync process
- Monitor and validate sync
- Address any data inconsistencies

### Phase 3: Final Validation (1-2 days)
- Final data sync
- Comprehensive validation
- Performance testing
- Application testing

## Risk Mitigation

### Data Loss Prevention
- Complete backups before migration
- Validation at each step
- Rollback procedures
- Incremental sync during testing

### Downtime Minimization
- Phased approach
- Parallel testing environment
- Minimal cutover window
- Rollback capability

### Performance Issues
- Performance testing before migration
- Index optimization
- Query optimization
- Monitoring during migration

This data migration guide ensures a smooth and reliable transfer of all data from Supabase to PostgreSQL while maintaining data integrity and minimizing downtime for the Sufi Essences platform.