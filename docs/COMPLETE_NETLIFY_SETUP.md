# Complete Netlify Setup Guide - Step by Step

## 📋 Table of Contents
1. [Build Settings](#build-settings)
2. [Environment Variables](#environment-variables)
3. [Deployment Steps](#deployment-steps)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## Build Settings

### **What to Enter in Each Field**

#### **1. Branch to deploy**
```
main
```
- This is the Git branch Netlify will deploy from
- Your code is on the `main` branch
- ✅ Correct value: `main`

#### **2. Base directory**
```
(LEAVE EMPTY - DO NOT ENTER ANYTHING)
```
- This is the directory where Netlify installs dependencies
- Leave empty to use project root
- ✅ Correct value: (empty)

#### **3. Build command**
```
npm run build
```
- This command builds your website
- It compiles TypeScript and creates the `dist/` folder
- ✅ Correct value: `npm run build`

#### **4. Publish directory**
```
dist
```
- This is the folder Netlify serves to visitors
- Created by the build command
- Contains your built website files
- ✅ Correct value: `dist`

#### **5. Functions directory**
```
netlify/functions
```
- For serverless functions (optional, for future use)
- Can be left as is
- ✅ Correct value: `netlify/functions`

---

## Environment Variables

### **Where to Add Them**
1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site Settings**
4. Click **Environment Variables**
5. Click **Add a variable**
6. Enter each variable below

### **REQUIRED Variables (Must Add)**

#### **1. DATABASE_URL**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- Your Neon PostgreSQL database connection
- Required for database access
- ✅ Copy exactly as shown

#### **2. JWT_SECRET**
```
Name: JWT_SECRET
Value: bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c
```
- Secret key for authentication tokens
- Required for user login/registration
- ✅ Copy exactly as shown

#### **3. VITE_APP_ENV**
```
Name: VITE_APP_ENV
Value: production
```
- Sets the app environment to production
- Required for production build
- ✅ Correct value: `production`

#### **4. FRONTEND_URL**
```
Name: FRONTEND_URL
Value: https://himalayanspicesexports.com
```
- Your website URL
- Used for CORS and redirects
- ✅ Correct value: `https://himalayanspicesexports.com`

#### **5. VITE_API_URL**
```
Name: VITE_API_URL
Value: https://himalayanspicesexports.com/api
```
- Your API endpoint URL
- Used by frontend to connect to backend
- ✅ Correct value: `https://himalayanspicesexports.com/api`

### **OPTIONAL Variables (Add if Using)**

#### **6. RAZORPAY_KEY_ID** (for payments)
```
Name: RAZORPAY_KEY_ID
Value: rzp_live_YOUR_KEY_ID
```
- Replace `YOUR_KEY_ID` with your actual Razorpay key
- Only add if using Razorpay payments

#### **7. RAZORPAY_KEY_SECRET** (for payments)
```
Name: RAZORPAY_KEY_SECRET
Value: your_razorpay_secret
```
- Replace with your actual Razorpay secret
- Only add if using Razorpay payments

#### **8. VITE_RAZORPAY_KEY_ID** (for payments)
```
Name: VITE_RAZORPAY_KEY_ID
Value: rzp_live_YOUR_KEY_ID
```
- Same as RAZORPAY_KEY_ID
- Only add if using Razorpay payments

#### **9. SENDGRID_API_KEY** (for emails)
```
Name: SENDGRID_API_KEY
Value: SG.YOUR_SENDGRID_KEY
```
- Replace with your SendGrid API key
- Only add if using email notifications

#### **10. EMAIL_FROM** (for emails)
```
Name: EMAIL_FROM
Value: orders@himalayanspicesexports.com
```
- Email address for sending notifications
- Only add if using email notifications

#### **11. VITE_GA_MEASUREMENT_ID** (for analytics)
```
Name: VITE_GA_MEASUREMENT_ID
Value: G-YOUR_MEASUREMENT_ID
```
- Replace with your Google Analytics ID
- Only add if using Google Analytics

---

## Deployment Steps

### **Step 1: Connect Git Repository**
1. Go to https://app.netlify.com
2. Click **"New site from Git"** button
3. Select your Git provider (GitHub/GitLab)
4. Click **"Authorize Netlify"**
5. Select **perfumes** repository
6. Click **"Connect"**

### **Step 2: Configure Build Settings**
1. You'll see the build configuration form
2. Fill in the fields:
   - **Branch to deploy**: `main`
   - **Base directory**: (leave empty)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. Click **"Deploy site"** button

### **Step 3: Wait for Initial Build**
1. Netlify will start building your site
2. Watch the build progress
3. Wait for build to complete (~2-3 minutes)
4. You'll see a success message

### **Step 4: Add Environment Variables**
1. Go to **Site Settings** tab
2. Click **Environment Variables** in left menu
3. Click **"Add a variable"** button
4. Add each REQUIRED variable:
   - DATABASE_URL
   - JWT_SECRET
   - VITE_APP_ENV
   - FRONTEND_URL
   - VITE_API_URL
5. Add optional variables if needed

### **Step 5: Trigger New Deployment**
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** button
3. Select **"Deploy site"**
4. Wait for new build to complete
5. Deployment will be live

---

## Verification

### **Check Website Works**
1. Open https://himalayanspicesexports.com
2. Should see home page (NOT 404 error)
3. Open browser console (F12)
4. Should be clean (no errors)

### **Test Navigation**
- [ ] Home page loads
- [ ] Can navigate to /products
- [ ] Can navigate to /about
- [ ] Can navigate to /auth
- [ ] Can navigate to /cart
- [ ] Can navigate to /checkout

### **Test Functionality**
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Can proceed to checkout

### **Check Netlify Logs**
1. Go to **Deploys** tab
2. Click latest deploy
3. Check **"Deploy log"** for any errors
4. Should show "Deploy complete"

---

## Troubleshooting

### **Build Fails**
**Problem**: Build shows error in Netlify dashboard

**Solutions**:
1. Check build logs for error message
2. Verify all environment variables are set
3. Check Node.js version (should be 18+)
4. Try clearing Netlify cache:
   - Go to Deploys
   - Click "Clear cache and redeploy"

### **Still Seeing 404**
**Problem**: Website shows "Page not found" error

**Solutions**:
1. Clear browser cache: Ctrl+Shift+Delete
2. Try incognito/private window
3. Wait 5 minutes for DNS to propagate
4. Check netlify.toml is in project root

### **API Errors**
**Problem**: API calls failing, database errors

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check JWT_SECRET is set
3. Verify FRONTEND_URL matches your domain
4. Check VITE_API_URL is correct
5. Test database connection in Neon dashboard

### **Console Errors**
**Problem**: JavaScript errors in browser console

**Solutions**:
1. Clear browser cache
2. Try incognito window
3. Check environment variables are set
4. Check Netlify build logs

### **Slow Loading**
**Problem**: Website takes too long to load

**Solutions**:
1. Check Netlify function logs
2. Monitor database performance
3. Check network tab in DevTools
4. Verify API responses are fast

---

## Quick Reference Table

| Field | Value |
|-------|-------|
| Branch | main |
| Base directory | (empty) |
| Build command | npm run build |
| Publish directory | dist |
| Functions directory | netlify/functions |

---

## Environment Variables Summary

| Variable | Required | Value |
|----------|----------|-------|
| DATABASE_URL | ✅ Yes | postgresql://... |
| JWT_SECRET | ✅ Yes | bbfb4b05f2... |
| VITE_APP_ENV | ✅ Yes | production |
| FRONTEND_URL | ✅ Yes | https://himalayanspicesexports.com |
| VITE_API_URL | ✅ Yes | https://himalayanspicesexports.com/api |
| RAZORPAY_KEY_ID | ❌ Optional | rzp_live_... |
| RAZORPAY_KEY_SECRET | ❌ Optional | your_secret |
| SENDGRID_API_KEY | ❌ Optional | SG.your_key |
| EMAIL_FROM | ❌ Optional | orders@himalayanspicesexports.com |
| VITE_GA_MEASUREMENT_ID | ❌ Optional | G-your_id |

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Connect repository | 1 min | ✅ |
| Configure build | 2 min | ✅ |
| Initial build | 2-3 min | ✅ |
| Add environment variables | 2 min | ✅ |
| Trigger new deployment | 2-3 min | ✅ |
| **Total** | **~10 min** | ✅ |

---

## Success Indicators

✅ Build completes without errors
✅ Website loads at https://himalayanspicesexports.com
✅ No 404 errors
✅ Browser console is clean
✅ All pages accessible
✅ Navigation works
✅ API calls work
✅ Database connected

---

## Support

If you need help:
1. Check Netlify build logs
2. Check browser console (F12)
3. Try clearing cache
4. Try incognito window
5. Check environment variables

---

**Your website will be live in ~10 minutes!** 🚀

**Next Step**: Go to https://app.netlify.com and start the setup!
