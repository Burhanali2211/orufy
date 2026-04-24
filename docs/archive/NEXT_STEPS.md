# Next Steps - Supabase Direct Integration

## 1. Update Frontend Code

Replace all API calls with Supabase helpers.

### Example: Products Page

**Before (Express):**
```typescript
const response = await fetch('/api/products?page=1&limit=20');
const { data } = await response.json();
```

**After (Supabase):**
```typescript
import { db } from '@/lib/supabase';

const { data, total, page, limit } = await db.getProducts(1, 20);
```

### Example: Public Settings

**Before (Express):**
```typescript
const response = await fetch('/api/public/settings');
const settings = await response.json();
```

**After (Supabase):**
```typescript
import { db } from '@/lib/supabase';

const settings = await db.getAllPublicSettings();
```

## 2. Verify Supabase Tables

Make sure these tables exist in your Supabase project:
- [ ] products
- [ ] categories
- [ ] orders
- [ ] cart_items
- [ ] addresses
- [ ] site_settings
- [ ] social_media_accounts
- [ ] contact_information
- [ ] footer_links
- [ ] business_hours
- [ ] profiles
- [ ] payment_methods

## 3. Enable Row Level Security

In Supabase dashboard, enable RLS on all tables:

```sql
-- Example policies
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Anyone can view public settings"
ON site_settings FOR SELECT
USING (is_public = true);
```

## 4. Set Environment Variables

In Vercel project settings, add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_MEASUREMENT_ID=G-your-id
```

## 5. Deploy

```bash
git add .
git commit -m "Switch to Supabase direct integration"
git push origin main
```

Vercel will auto-deploy.

## 6. Test

1. Open website in browser
2. Check browser console for errors
3. Test product loading
4. Test cart operations
5. Test order creation

## 7. Monitor

Check Supabase logs:
1. Go to Supabase dashboard
2. Select your project
3. Go to Logs
4. Monitor for errors

## Common Issues

### "Missing Supabase environment variables"
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel

### "Permission denied" errors
- Enable Row Level Security policies in Supabase
- Check RLS policies are correct

### "Table does not exist"
- Create missing tables in Supabase
- Check table names match exactly

### "Unauthorized" errors
- Check Supabase anon key is correct
- Verify RLS policies allow the operation

## Files to Delete (Optional)

These are no longer needed:
- `api/` folder
- `server/` folder
- `netlify.toml`
- `netlify/` folder

## Documentation

- `docs/SUPABASE.md` - Supabase setup
- `SUPABASE_INTEGRATION.md` - Integration details
- `SUPABASE_READY.md` - Status

## Support

If you have issues:
1. Check Supabase logs
2. Check browser console
3. Verify environment variables
4. Check RLS policies
5. Test with Supabase dashboard directly

## Status

✅ Ready to deploy
✅ No backend server needed
✅ Pure Supabase integration
✅ Frontend-only deployment
