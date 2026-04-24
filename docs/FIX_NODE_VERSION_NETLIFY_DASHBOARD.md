# Fix: Set Node.js Version in Netlify Dashboard

## Problem
Netlify is still using Node.js 18.17.0 even though we updated netlify.toml.

**Error**:
```
You are using Node.js 18.17.0. Vite requires Node.js version 20.19+ or 22.12+.
```

## Root Cause
Netlify Dashboard settings override netlify.toml settings. We need to set the Node.js version in the Netlify Dashboard, not just in netlify.toml.

## Solution
Set Node.js version directly in Netlify Dashboard.

---

## Step-by-Step Fix

### Step 1: Go to Netlify Dashboard
1. Go to https://app.netlify.com
2. Select **himalayanspicesexports** site
3. Go to **Site Settings** tab

### Step 2: Find Build & Deploy Settings
1. In left menu, click **Build & deploy**
2. Click **Environment** section
3. Look for "Node.js version" setting

### Step 3: Set Node.js Version
1. Find the Node.js version field
2. Change from **18.17.0** to **20.19.0**
3. Click **Save**

### Step 4: Clear Cache and Redeploy
1. Go to **Deploys** tab
2. Click **"Clear cache and redeploy"** button
3. Wait for build to complete

---

## Alternative: Set via Environment Variables

If you don't see a Node.js version field:

1. Go to **Site Settings** → **Environment Variables**
2. Add this variable:
   ```
   Name: NODE_VERSION
   Value: 20.19.0
   ```
3. Go to **Deploys** tab
4. Click **"Clear cache and redeploy"**

---

## Expected Result

### Before ❌
```
You are using Node.js 18.17.0. Vite requires Node.js version 20.19+ or 22.12+.
Build failed
```

### After ✅
```
Build succeeds
Website deploys
No Node.js errors
```

---

## Verification

After setting Node.js version:
1. Go to **Deploys** tab
2. Check latest deploy
3. Should show Node.js 20.19.0 in build logs
4. Build should complete successfully

---

## If Still Not Working

### Option 1: Use netlify.toml Only
Make sure netlify.toml has:
```toml
[build.environment]
  NODE_VERSION = "20.19.0"
  NPM_VERSION = "10.8.0"
```

### Option 2: Use Environment Variables Only
In Netlify Dashboard → Environment Variables:
```
NODE_VERSION = 20.19.0
NPM_VERSION = 10.8.0
```

### Option 3: Use Both
Set in both netlify.toml AND Netlify Dashboard for redundancy.

---

## Summary

✅ Set Node.js version to 20.19.0 in Netlify Dashboard
✅ Clear cache and redeploy
✅ Build should now succeed
✅ Website will deploy

**Next Step**: Go to Netlify Dashboard and set Node.js version to 20.19.0
