# Quick Deployment Guide - HimalayanSpicesExportss to Netlify

## ⚡ 5-Minute Quick Start

### Step 1: Verify Local Build (2 minutes)
```bash
cd d:\perfumes
npm run build
# Should complete in ~40 seconds with no errors
```

### Step 2: Connect to Netlify (1 minute)
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select GitHub/GitLab and authorize
4. Choose the `perfumes` repository
5. Click "Deploy site"

### Step 3: Set Environment Variables (2 minutes)
Go to **Netlify Dashboard → Site Settings → Environment Variables** and add:

**REQUIRED:**
```
DATABASE_URL = postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET = bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c

VITE_APP_ENV = production

FRONTEND_URL = https://your-site.netlify.app

VITE_API_URL = https://your-site.netlify.app/api
```

**OPTIONAL (if using):**
```
RAZORPAY_KEY_ID = your_key
RAZORPAY_KEY_SECRET = your_secret
SENDGRID_API_KEY = your_key
VITE_GA_MEASUREMENT_ID = your_id
```

### Step 4: Trigger Deployment
- Click "Trigger deploy" in Netlify dashboard
- Wait for build to complete (~2 minutes)
- Check build logs for any errors

### Step 5: Verify Site Works
1. Visit your site URL
2. Test login/register
3. Add product to cart
4. Try checkout
5. Check browser console for errors

---

## 📋 Pre-Deployment Checklist

- [ ] `npm run build` succeeds locally
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `netlify.toml` exists
- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Database connection tested
- [ ] All required env vars identified

---

## 🚨 Common Issues & Fixes

### Build Fails
```
Check: npm run build locally
Fix: Verify Node.js version 18+
Fix: Clear node_modules and reinstall
```

### Database Connection Error
```
Check: DATABASE_URL is correct
Fix: Test connection string in Neon dashboard
Fix: Verify IP whitelist (if applicable)
```

### CORS Errors
```
Check: FRONTEND_URL matches your Netlify domain
Fix: Verify VITE_API_URL is set correctly
Fix: Check server CORS configuration
```

### Site Won't Load
```
Check: Netlify deployment status
Fix: Clear browser cache
Fix: Check browser console for errors
```

---

## 📞 Important URLs

- **Netlify Dashboard**: https://app.netlify.com
- **Neon Dashboard**: https://console.neon.tech
- **Your Site**: https://your-site.netlify.app
- **Deployment Guide**: `docs/NETLIFY_DEPLOYMENT_GUIDE.md`
- **Full Checklist**: `docs/DEPLOYMENT_CHECKLIST.md`

---

## ✅ Success Indicators

✅ Site loads without errors
✅ Can login/register
✅ Can add products to cart
✅ Can proceed to checkout
✅ No console errors
✅ No CORS errors
✅ Database queries work
✅ Images load correctly

---

## 🔄 Rollback (if needed)

1. Go to Netlify Dashboard → Deploys
2. Find previous successful deployment
3. Click "Publish deploy"
4. Confirm rollback

---

**Status**: ✅ Ready to Deploy
**Estimated Time**: 5-10 minutes
**Risk Level**: 🟢 LOW
