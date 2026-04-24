# Netlify Function Setup - Complete Guide

## Overview

This document explains the Netlify serverless function setup that wraps the Express.js backend for deployment on Netlify.

## Architecture

```
User Request: /api/auth/login
    ↓
Netlify Redirect: /.netlify/functions/api/auth/login
    ↓
Netlify Function: netlify/functions/api.ts
    ↓
Path Transformation: /api/auth/login (adds /api prefix)
    ↓
Express App: server/dist/index.js
    ↓
Route Handler: /api/auth/login
```

## Files Created

### 1. `netlify/functions/api.ts`
- Main Netlify serverless function
- Wraps Express app using `serverless-http`
- Handles path transformation (adds `/api` prefix)
- Sets `IS_SERVERLESS=true` environment variable
- Lazy loads Express app to avoid initialization issues

### 2. `netlify.toml` Updates
- Configured function directory: `netlify/functions`
- Set ESM format for the API function
- Included server compiled files in function bundle
- Redirect rule: `/api/*` → `/.netlify/functions/api/:splat`

## How It Works

### Path Transformation

Netlify Functions strip the function name from the path:
- Request: `/api/auth/login`
- Netlify redirects to: `/.netlify/functions/api/auth/login`
- Function receives: `event.path = "/auth/login"` (function name stripped)
- Function transforms to: `/api/auth/login` (adds `/api` prefix)
- Express receives: `/api/auth/login` (matches route)

### Environment Variables

The function sets:
- `IS_SERVERLESS=true` - Tells Express not to start HTTP server
- `NODE_ENV=production` - Sets production mode

### Lazy Loading

The Express app is loaded lazily on first request:
- Avoids top-level await issues
- Better error handling
- Faster cold starts (app only loads when needed)

## Build Process

1. **Server Build**: `npm run build:server`
   - Compiles `server/` → `server/dist/`
   - TypeScript → JavaScript (ES2020 modules)

2. **Frontend Build**: `npx vite build`
   - Builds React app → `dist/`

3. **Netlify Build**: `npm run build`
   - Runs both builds
   - Netlify bundles function with server code

## Deployment Checklist

- [x] Netlify function created (`netlify/functions/api.ts`)
- [x] `netlify.toml` configured
- [x] Path transformation implemented
- [x] CORS headers handled
- [x] Error handling implemented
- [x] Serverless mode detection in Express app
- [x] Build process verified

## Environment Variables Required

Make sure these are set in Netlify Dashboard:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token signing secret (min 32 chars)
- `FRONTEND_URL` - Your Netlify site URL (for CORS)

### Optional
- `RAZORPAY_KEY_ID` - Razorpay payment gateway
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `SENDGRID_API_KEY` - Email service
- `REDIS_URL` - Redis cache (optional)

## Testing

### Local Testing

1. Build the project:
   ```bash
   npm run build
   ```

2. Test with Netlify CLI (if installed):
   ```bash
   netlify dev
   ```

3. Or test the Express server directly:
   ```bash
   npm run dev:server
   ```

### Production Testing

After deployment, test these endpoints:
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `POST /api/auth/login` - User login
- `GET /api/categories` - List categories

## Troubleshooting

### 404 Errors

If you get 404 errors:
1. Check that `netlify/functions/api.ts` exists
2. Verify `netlify.toml` has correct function directory
3. Check build logs for compilation errors
4. Verify redirect rule in `netlify.toml`

### Function Import Errors

If the function can't import the Express app:
1. Verify `server/dist/index.js` exists after build
2. Check that server exports default app: `export default app;`
3. Verify `IS_SERVERLESS` is set before import
4. Check Netlify build logs for import errors

### Path Issues

If routes return 404:
1. Check path transformation in function
2. Verify Express routes are mounted at `/api/*`
3. Check Netlify redirect rule
4. Test with `event.path` logging

### Database Connection Issues

If database connections fail:
1. Verify `DATABASE_URL` is set in Netlify
2. Check database allows connections from Netlify IPs
3. Verify SSL is configured (Neon requires SSL)
4. Check connection pool settings for serverless

## Key Features

✅ **Serverless-Compatible**: Express app runs in serverless mode
✅ **Path Handling**: Automatic path transformation
✅ **CORS Support**: Proper CORS headers for frontend
✅ **Error Handling**: Comprehensive error responses
✅ **Lazy Loading**: Fast cold starts
✅ **Type Safety**: TypeScript with proper types
✅ **Production Ready**: Optimized for Netlify deployment

## Next Steps

1. Deploy to Netlify
2. Set environment variables in Netlify Dashboard
3. Test all API endpoints
4. Monitor function logs for errors
5. Optimize cold start times if needed

