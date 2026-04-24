# Deployment Fixes - Complete Guide

## Issues Fixed

### 1. **API Errors (FUNCTION_INVOCATION_FAILED)**
**Problem:** API endpoints were returning `FUNCTION_INVOCATION_FAILED` errors on Netlify Functions.

**Root Cause:** 
- The Netlify function handler was too complex and had issues with body parsing
- Path transformation was not working correctly
- Request body was not being properly passed to Express

**Solution:**
- Simplified the Netlify function handler (`netlify/functions/api.ts`)
- Fixed path transformation logic to properly prepend `/api` to routes
- Improved body parsing to handle both string and JSON bodies
- Added proper error handling and logging

### 2. **Firebase IndexedDB Errors**
**Problem:** 
```
Firebase: Error thrown when reading from IndexedDB. 
Original error: IDBDatabase.transaction: 'firebase-heartbeat-store' is not a known object store name.
```

**Root Cause:** Firebase storage issues in browser, not related to backend

**Solution:**
- These are client-side Firebase issues that don't affect the backend API
- The backend is properly configured with Supabase PostgreSQL
- No action needed on backend for this error

### 3. **Content-Security-Policy Violations**
**Problem:** CSP headers were blocking WebSocket connections and other resources

**Solution:**
- Updated `netlify.toml` CSP headers to allow:
  - WebSocket connections to Supabase
  - Google Analytics
  - Razorpay payment gateway
  - Unsplash images
  - All necessary third-party services

### 4. **Missing Google Analytics Measurement ID**
**Problem:** `VITE_GA_MEASUREMENT_ID` was empty in production

**Solution:**
- Updated `.env.production` with placeholder `G-XXXXXXXXXX`
- **ACTION REQUIRED:** Replace with your actual Google Analytics Measurement ID

### 5. **Database Connection Issues**
**Problem:** Serverless environment had issues connecting to Supabase

**Solution:**
- Configured proper connection pooling for serverless (max 1 connection)
- Set `IS_SERVERLESS=true` in `.env.production`
- Improved error handling to not fail app export if DB init fails
- Database will initialize on first request if needed

## Key Configuration Files Updated

### 1. `netlify/functions/api.ts`
- Simplified handler logic
- Fixed path transformation
- Improved body parsing
- Better error handling

### 2. `.env.production`
- Set `IS_SERVERLESS=true`
- Set `DB_POOL_SIZE=1` for serverless
- Added placeholder for `VITE_GA_MEASUREMENT_ID`

### 3. `netlify.toml`
- Updated CSP headers to allow all necessary services
- Proper redirects for API and uploads
- Correct build configuration

### 4. `server/index.ts`
- Improved serverless mode handling
- Better error logging
- Non-blocking database initialization

## Deployment Checklist

### Before Deploying:

1. **Update Google Analytics ID**
   ```bash
   # In .env.production, replace:
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   # With your actual measurement ID from Google Analytics
   ```

2. **Verify Environment Variables**
   - `DATABASE_URL` - Supabase PostgreSQL connection string ✓
   - `SUPABASE_URL` - Supabase project URL ✓
   - `SUPABASE_ANON_KEY` - Supabase anonymous key ✓
   - `JWT_SECRET` - Secure JWT secret ✓
   - `RAZORPAY_KEY_ID` - Razorpay live key ✓
   - `RAZORPAY_KEY_SECRET` - Razorpay secret ✓
   - `VITE_GA_MEASUREMENT_ID` - Google Analytics ID (UPDATE THIS)

3. **Test Locally**
   ```bash
   npm run dev
   # Test API endpoints at http://localhost:5001
   # Test frontend at http://localhost:5173
   ```

4. **Build for Production**
   ```bash
   npm run build
   # This compiles both frontend and server
   ```

### Deployment Steps:

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Fix deployment issues and improve serverless configuration"
   git push origin main
   ```

2. **Netlify Deployment**
   - Netlify will automatically build and deploy
   - Build command: `NODE_ENV=production npm ci && npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

3. **Verify Deployment**
   - Check Netlify Functions logs
   - Test API endpoints: `https://www.himalayanspicesexports.com/api/health`
   - Test products endpoint: `https://www.himalayanspicesexports.com/api/products`
   - Check browser console for errors

## API Endpoints to Test

After deployment, test these endpoints:

```bash
# Health check
curl https://www.himalayanspicesexports.com/api/health

# Get products
curl https://www.himalayanspicesexports.com/api/products?page=1&limit=20

# Get categories
curl https://www.himalayanspicesexports.com/api/categories

# Login (test with valid credentials)
curl -X POST https://www.himalayanspicesexports.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Troubleshooting

### If API endpoints still return errors:

1. **Check Netlify Function Logs**
   - Go to Netlify Dashboard → Functions → api
   - Look for error messages

2. **Verify Database Connection**
   - Ensure `DATABASE_URL` is correct
   - Check Supabase connection status
   - Verify network access rules

3. **Check CORS Headers**
   - Verify CSP headers in `netlify.toml`
   - Check browser console for CSP violations

4. **Review Request/Response**
   - Use browser DevTools Network tab
   - Check request headers and body
   - Verify response status and body

### Common Issues:

**Issue:** `FUNCTION_INVOCATION_FAILED`
- **Solution:** Check Netlify function logs for actual error
- Verify `DATABASE_URL` is set correctly
- Ensure server code compiles without errors

**Issue:** `CORS error`
- **Solution:** Check CSP headers in `netlify.toml`
- Verify origin is in allowed list
- Check browser console for specific CSP violation

**Issue:** `Database connection timeout`
- **Solution:** Verify Supabase is accessible
- Check network firewall rules
- Ensure connection string is correct

**Issue:** `Empty body in POST requests`
- **Solution:** Already fixed in Netlify function handler
- Verify `Content-Type: application/json` header is sent
- Check request body is valid JSON

## Performance Optimization

The deployment is optimized for serverless:

1. **Connection Pooling**
   - Max 1 connection in serverless mode
   - Prevents connection exhaustion

2. **Request Timeouts**
   - 8 second timeout for image requests
   - Leaves buffer for Netlify's 10s limit

3. **Caching**
   - Products cached for 15 minutes
   - Images cached for 1 year
   - Reduces database load

4. **Error Handling**
   - Graceful degradation if DB init fails
   - App still exports even if DB unavailable
   - Proper error responses to clients

## Next Steps

1. **Update Google Analytics ID** (REQUIRED)
2. **Deploy to Netlify**
3. **Test all API endpoints**
4. **Monitor Netlify Functions logs**
5. **Check browser console for errors**
6. **Verify database queries are working**

## Support

If you encounter issues:

1. Check Netlify Function logs
2. Review browser DevTools Network tab
3. Check server error logs
4. Verify all environment variables are set
5. Test locally with `npm run dev`
