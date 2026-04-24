# 🚀 Quick Fix - Node.js Version Error

## Problem
```
You are using Node.js 18.17.0. Vite requires Node.js version 20.19+ or 22.12+.
Build failed due to a user error: Build script returned non-zero exit code: 2
```

## Solution
Updated `netlify.toml` to use Node.js 20.19.0

## Deploy the Fix (2 Steps)

### Step 1: Commit & Push
```bash
cd d:\perfumes
git add netlify.toml
git commit -m "Fix: Update Node.js version to 20.19.0"
git push origin main
```

### Step 2: Trigger Netlify Deploy
1. Go to https://app.netlify.com
2. Select **himalayanspicesexports** site
3. Go to **Deploys** tab
4. Click **"Trigger deploy"**
5. Wait for build to complete

## Expected Result
✅ Build succeeds
✅ Website deploys
✅ No Node.js errors

## Verification
- Visit https://himalayanspicesexports.com
- Should see home page (not 404)
- Browser console should be clean

---

**Your website will be live in ~5 minutes!** 🚀
