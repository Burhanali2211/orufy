# Supabase Setup – Himalayan Spices E-Commerce

## Tables used by the app

- **profiles** – user profiles (role, full_name, etc.)
- **products** – product catalog
- **categories** – product categories
- **orders** – customer orders
- **order_items** – order line items
- **cart_items** – shopping cart
- **addresses** – user addresses
- **wishlist_items** – wishlist
- **reviews** – product reviews
- **site_settings** – site config (key/value)
- **footer_links** – footer navigation
- **contact_submissions** – contact form submissions
- **social_media_accounts** – social links (optional)
- **contact_information** – contact details (optional)
- **business_hours** – opening hours (optional)

Any other tables in your project are unused; you can drop them in the SQL Editor if you want a clean schema.

## 1. Apply RLS policies

In **Supabase Dashboard → SQL Editor**, run the migration file so data is readable/writable correctly:

1. Open `supabase/migrations/001_rls_policies.sql`.
2. Copy its full contents.
3. Paste into a new query in the SQL Editor and run it.

If you get errors like "relation X does not exist", remove or comment out the blocks for those tables (e.g. `social_media_accounts`, `contact_information`, `business_hours`) and run again.

## 2. Seed data (Kashmir / Himalayan spices)

From the project root:

```bash
node scripts/seedSupabaseData.js
```

Requires `.env` with:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

This seeds categories, products, and site settings for a spices-only store (no perfumes/attars).

## 3. Optional: drop unused tables

In the SQL Editor you can drop tables that are not in the list above. Do this only after you’ve confirmed they’re not used. Example (adjust names to what you see in the dashboard):

```sql
-- Example: drop a table you know is unused
-- DROP TABLE IF EXISTS public.some_unused_table CASCADE;
```

Run such statements one at a time and confirm each table name.
