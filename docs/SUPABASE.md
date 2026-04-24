# Supabase Direct Integration

This project uses Supabase PostgreSQL directly from the frontend.

## Setup

### Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_MEASUREMENT_ID=G-your-id
```

### Supabase Configuration

1. Create Supabase project
2. Set up PostgreSQL database
3. Create tables (products, categories, orders, etc.)
4. Enable Row Level Security (RLS) for security
5. Get your project URL and anon key

## Usage

### Import Supabase Client

```typescript
import { supabase, db } from '@/lib/supabase';
```

### Use Database Helpers

```typescript
// Get products
const products = await db.getProducts(1, 20);

// Get categories
const categories = await db.getCategories();

// Get public settings
const settings = await db.getAllPublicSettings();

// Get cart
const cart = await db.getCart(userId);

// Create order
const order = await db.createOrder(orderData);
```

### Direct Supabase Queries

```typescript
// Custom query
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);
```

## Database Schema

### Tables Required

- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `cart_items` - Shopping cart
- `addresses` - Shipping addresses
- `site_settings` - Public settings
- `social_media_accounts` - Social links
- `contact_information` - Contact details
- `footer_links` - Footer navigation
- `business_hours` - Operating hours
- `profiles` - User profiles
- `payment_methods` - Payment options

## Security

### Row Level Security (RLS)

Enable RLS on all tables and set policies:

```sql
-- Example: Users can only see their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);
```

### Authentication

Use Supabase Auth for user management:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## Deployment

Deploy frontend to Vercel:
1. Connect GitHub repository
2. Set environment variables
3. Deploy

No backend server needed - Supabase handles all data operations.
