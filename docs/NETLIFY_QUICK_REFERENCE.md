# 🚀 Netlify Configuration - Quick Reference Card

## Copy & Paste Values

### **Build Settings**

```
Branch to deploy:        main
Base directory:          (LEAVE EMPTY)
Build command:           npm run build
Publish directory:       dist
Functions directory:     netlify/functions
```

---

## **Environment Variables**

### **REQUIRED - Copy these exactly:**

```
DATABASE_URL
postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET
bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c

VITE_APP_ENV
production

FRONTEND_URL
https://himalayanspicesexports.com

VITE_API_URL
https://himalayanspicesexports.com/api
```

---

## **Netlify Setup Steps**

### **1. Connect Repository**
- Go to https://app.netlify.com
- Click "New site from Git"
- Select GitHub/GitLab
- Choose **perfumes** repository

### **2. Configure Build**
- Branch: `main`
- Base directory: (leave empty)
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### **3. Add Environment Variables**
- Go to Site Settings → Environment Variables
- Add all 5 REQUIRED variables above

### **4. Deploy**
- Click "Deploy site"
- Wait 2-3 minutes for build
- Visit https://himalayanspicesexports.com

---

## **Verification**

After deployment:
- [ ] Home page loads (not 404)
- [ ] Can navigate to /products
- [ ] Browser console is clean
- [ ] No errors in Netlify logs

---

## **If Issues Occur**

1. **404 Error**: Clear browser cache (Ctrl+Shift+Delete)
2. **Build Fails**: Check Netlify build logs
3. **API Errors**: Verify environment variables are set
4. **Still Issues**: Try incognito window

---

**Your website will be live in ~5 minutes!** 🚀
