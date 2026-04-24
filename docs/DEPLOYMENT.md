# Deployment Guide - Vercel

## Prerequisites
- Vercel account
- Supabase project
- GitHub repository

## Environment Variables

Set these in Vercel project settings:

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://www.himalayanspicesexports.com/api
VITE_RAZORPAY_KEY_ID=...
VITE_GA_MEASUREMENT_ID=G-...
FRONTEND_URL=https://www.himalayanspicesexports.com
```

## Deployment Steps

1. Connect GitHub repository to Vercel
2. Set environment variables in project settings
3. Deploy:
   ```bash
   git push origin main
   ```
4. Vercel automatically builds and deploys

## Build Configuration

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

## API Routes

API routes are handled by `/api/index.ts` which exports the Express app.

Vercel automatically routes:
- `/api/*` → Express app
- `/*` → React frontend (SPA)

## Database

Uses Supabase PostgreSQL. Connection string in `DATABASE_URL`.

## Monitoring

Check Vercel dashboard for:
- Build logs
- Function logs
- Performance metrics
- Error tracking
