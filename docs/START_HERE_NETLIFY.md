# 🚀 START HERE - Netlify Setup Instructions

## What You Need to Do

You're at the Netlify configuration screen. Here's exactly what to enter in each field.

---

## **Build Settings Form**

### **Copy & Paste These Values:**

```
Branch to deploy:        main
Base directory:          (LEAVE EMPTY)
Build command:           npm run build
Publish directory:       dist
Functions directory:     netlify/functions
```

---

## **Environment Variables**

After clicking "Deploy site", go to:
**Site Settings → Environment Variables**

Add these 5 REQUIRED variables:

### **1. DATABASE_URL**
```
postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### **2. JWT_SECRET**
```
bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c
```

### **3. VITE_APP_ENV**
```
production
```

### **4. FRONTEND_URL**
```
https://himalayanspicesexports.com
```

### **5. VITE_API_URL**
```
https://himalayanspicesexports.com/api
```

---

## **Quick Setup Steps**

1. ✅ Fill in build settings (see above)
2. ✅ Click "Deploy site"
3. ✅ Wait for build to complete
4. ✅ Go to Site Settings → Environment Variables
5. ✅ Add all 5 variables (see above)
6. ✅ Go to Deploys tab
7. ✅ Click "Trigger deploy"
8. ✅ Wait for new build
9. ✅ Visit https://himalayanspicesexports.com

---

## **Detailed Guides**

For more information, see:
- **NETLIFY_FORM_FIELDS.txt** - Exact form values
- **COMPLETE_NETLIFY_SETUP.md** - Step-by-step guide
- **NETLIFY_QUICK_REFERENCE.md** - Quick reference
- **NETLIFY_CONFIGURATION_GUIDE.md** - Detailed guide

---

## **Timeline**

- Setup: ~10 minutes
- Build: ~2-3 minutes
- **Total: ~15 minutes**

---

## **Your website will be live in ~15 minutes!** 🚀

**Next Step**: Fill in the form with values above and click "Deploy site"
