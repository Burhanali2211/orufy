# Netlify Environment Variables - Production Setup

## ❌ CRITICAL ISSUE FOUND

Your environment variables have **one critical error** that will prevent the app from working correctly:

### Issue: `Node_ENV` should be `NODE_ENV`

**Current (WRONG):**
```
Node_ENV=production
```

**Should be (CORRECT):**
```
NODE_ENV=production
```

The code checks `process.env.NODE_ENV` (all uppercase), so `Node_ENV` won't be recognized and the app won't run in production mode.

---

## ✅ Corrected Environment Variables

Here's your complete, corrected environment variable list:

```bash
# Database Connection
DATABASE_URL=postgresql://neondb_owner:npg_nM3S5ZfKNrUX@ep-snowy-mouse-ae2w3j0k-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Frontend URL (for CORS)
FRONTEND_URL=https://himalayanspicesexports.com

# JWT Secret (32+ characters) ✅
JWT_SECRET=p7JQw4X9eB2LmA0rV8tFy3KdS6nZh5Uc

# Node Environment (FIXED: was Node_ENV)
NODE_ENV=production

# Frontend API URL
VITE_API_URL=https://himalayanspicesexports.com/api

# Site URL
VITE_SITE_URL=https://himalayanspicesexports.com
```

---

## ✅ Variable Validation

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | ✅ Correct | Neon PostgreSQL connection string |
| `FRONTEND_URL` | ✅ Correct | Matches your Netlify site URL |
| `JWT_SECRET` | ✅ Correct | 32 characters (meets minimum requirement) |
| `NODE_ENV` | ❌ **FIX NEEDED** | Should be `NODE_ENV` not `Node_ENV` |
| `VITE_API_URL` | ✅ Correct | Points to your API endpoint |
| `VITE_SITE_URL` | ✅ Correct | Matches your site URL |

---

## 🔧 How to Fix in Netlify

1. Go to your Netlify Dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Find the variable: `Node_ENV`
4. **Delete it** or **Edit it** to: `NODE_ENV` (all uppercase)
5. Set the value to: `production`
6. **Save** the changes
7. **Redeploy** your site (or trigger a new deployment)

---

## 📋 Required vs Optional Variables

### Required (Must Have)
- ✅ `DATABASE_URL` - Database connection
- ✅ `JWT_SECRET` - Authentication (min 32 chars)
- ✅ `FRONTEND_URL` - CORS configuration
- ✅ `NODE_ENV` - Environment mode (must be `production`)

### Optional (Nice to Have)
- `VITE_API_URL` - Frontend API base URL (has fallback)
- `VITE_SITE_URL` - Site URL (for metadata)
- `RAZORPAY_KEY_ID` - Payment gateway (if using payments) ⚠️ **REQUIRED FOR PAYMENTS**
- `RAZORPAY_KEY_SECRET` - Payment gateway secret ⚠️ **REQUIRED FOR PAYMENTS**
- `VITE_RAZORPAY_KEY_ID` - Frontend Razorpay key (same as RAZORPAY_KEY_ID) ⚠️ **REQUIRED FOR PAYMENTS**
- `SENDGRID_API_KEY` - Email service (if using emails)
- `REDIS_URL` - Caching (optional, has fallbacks)

---

## 💳 Adding Razorpay Credentials (For Payments)

If you're getting the error: "Payment service is not configured. Missing environment variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET", follow these steps:

### Step 1: Get Your Razorpay Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. If you don't have keys yet:
   - Click **Generate Test Key** for testing
   - Or **Generate Live Key** for production (real payments)
4. Copy the **Key ID** (starts with `rzp_test_` or `rzp_live_`)
5. Copy the **Key Secret**

### Step 2: Add to Netlify

1. Go to your Netlify Dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Click **Add a variable** and add these three variables:

   **Variable 1:**
   - Key: `RAZORPAY_KEY_ID`
   - Value: Your Razorpay Key ID (e.g., `rzp_live_xxxxxxxxxxxxx`)
   - Scope: All scopes (Production, Deploy previews, Branch deploys)

   **Variable 2:**
   - Key: `RAZORPAY_KEY_SECRET`
   - Value: Your Razorpay Secret Key
   - Scope: All scopes (Production, Deploy previews, Branch deploys)

   **Variable 3:**
   - Key: `VITE_RAZORPAY_KEY_ID`
   - Value: Same as `RAZORPAY_KEY_ID` (e.g., `rzp_live_xxxxxxxxxxxxx`)
   - Scope: All scopes (Production, Deploy previews, Branch deploys)

4. **Save** all changes
5. **Redeploy** your site (or trigger a new deployment)

### Step 3: Verify

After redeploying, test a payment:
1. Go to your checkout page
2. Try to make a payment
3. The error should be gone and payment should work

### Important Notes

- **Test vs Live Keys**: Use test keys (`rzp_test_...`) for development/testing. Use live keys (`rzp_live_...`) for production.
- **Security**: Never commit these keys to Git. They're already in `.gitignore`.
- **Redeploy Required**: After adding environment variables, you **must redeploy** for changes to take effect.

---

## 🧪 Testing After Fix

After updating `NODE_ENV`, test these endpoints:

1. **Health Check**: `GET https://himalayanspicesexports.com/api/health`
2. **Products**: `GET https://himalayanspicesexports.com/api/products`
3. **Categories**: `GET https://himalayanspicesexports.com/api/categories`

All should return proper responses (not 404 or 500 errors).

---

## ⚠️ Security Notes

1. ✅ Your `JWT_SECRET` is 32 characters (good!)
2. ✅ Database URL uses SSL (`sslmode=require`)
3. ⚠️ Make sure `JWT_SECRET` is truly random and not predictable
4. ⚠️ Never commit these values to Git (they're in `.gitignore`)

---

## 📝 Quick Fix Checklist

- [ ] Change `Node_ENV` to `NODE_ENV` in Netlify Dashboard
- [ ] Verify all other variables are set correctly
- [ ] Redeploy the site
- [ ] Test API endpoints
- [ ] Check Netlify function logs for errors
- [ ] Verify CORS is working (no CORS errors in browser console)

---

## 🎯 Summary

**Only one fix needed**: Change `Node_ENV` → `NODE_ENV`

Everything else looks correct! Once you fix this, your deployment should work perfectly.

