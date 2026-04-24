# Google Analytics Setup Instructions

## Current Status
- ❌ Google Analytics Measurement ID is missing/placeholder
- ⚠️ Analytics disabled on production site

## How to Fix

### Step 1: Get Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Select your property (Himalayan Spices Exports)
4. Go to **Admin** → **Property Settings**
5. Find **Measurement ID** (looks like `G-XXXXXXXXXX`)
6. Copy the full ID

### Step 2: Update Environment Variable

**Option A: Update .env.production file**

```bash
# Open .env.production
# Find this line:
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Replace with your actual ID:
VITE_GA_MEASUREMENT_ID=G-ABCDEF1234
```

**Option B: Update in Netlify Dashboard**

1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Add/Update variable:
   - Key: `VITE_GA_MEASUREMENT_ID`
   - Value: `G-ABCDEF1234` (your actual ID)
5. Trigger a new deploy

### Step 3: Verify Setup

After deployment:

1. Open your website in browser
2. Open DevTools (F12)
3. Go to **Console** tab
4. You should NOT see: "Google Analytics Measurement ID not found"
5. Go to **Network** tab
6. Look for requests to `www.google-analytics.com`
7. If present, GA is working ✅

### Step 4: Verify in Google Analytics

1. Go to Google Analytics
2. Go to **Real-time** → **Overview**
3. Visit your website
4. You should see active users in real-time ✅

## What This Enables

With GA properly configured:
- ✅ Track page views
- ✅ Track user behavior
- ✅ Monitor conversion funnels
- ✅ Analyze traffic sources
- ✅ Track e-commerce events
- ✅ Monitor performance metrics

## Troubleshooting

### GA still not working after update?

1. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check environment variable**
   ```bash
   # Verify in Netlify logs that GA ID is set
   # Look for: VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Check CSP headers**
   - Open DevTools → Network
   - Look for CSP violations
   - Should allow `www.google-analytics.com`

4. **Verify frontend code**
   - GA should be initialized in your React app
   - Check `src/main.tsx` or `src/App.tsx`
   - Look for `react-ga4` initialization

5. **Check Google Analytics settings**
   - Verify data stream is active
   - Check IP filtering isn't blocking your traffic
   - Verify measurement ID is correct

## Current GA Configuration

The frontend is configured to use:
- **Library**: react-ga4
- **Environment Variable**: VITE_GA_MEASUREMENT_ID
- **Tracking**: Page views, events, e-commerce

## Next Steps

1. ✅ Get your Measurement ID from Google Analytics
2. ✅ Update VITE_GA_MEASUREMENT_ID in .env.production
3. ✅ Commit and push changes
4. ✅ Wait for Netlify deploy
5. ✅ Verify GA is tracking
6. ✅ Monitor in Google Analytics dashboard

## Questions?

- Google Analytics Help: https://support.google.com/analytics
- Measurement ID Format: Always starts with `G-`
- React GA4 Docs: https://github.com/react-ga/react-ga4
