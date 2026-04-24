# Netlify Configuration Guide - Step by Step

## 📋 Netlify Build Settings - What to Enter

When you see the Netlify configuration form, here's exactly what to enter in each field:

---

## **Build Settings Form**

### **1. Branch to deploy**
```
main
```
✅ This is the branch Netlify will deploy from

---

### **2. Base directory**
```
(Leave EMPTY - leave blank)
```
✅ Leave this empty. Netlify will use the project root by default.

---

### **3. Build command**
```
npm run build
```
✅ This command:
- Compiles TypeScript
- Builds the Vite frontend
- Creates the `dist/` directory

---

### **4. Publish directory**
```
dist
```
✅ This is where the built website files are located
- Netlify will serve files from this directory
- This is created by the build command

---

### **5. Functions directory**
```
netlify/functions
```
✅ This is for serverless functions (optional, for future use)
- Leave as is for now
- Can be used later for API functions

---

## **Visual Guide**

```
┌─────────────────────────────────────────────────────┐
│ Netlify Build Configuration                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Branch to deploy:        main                       │
│                                                     │
│ Base directory:          (LEAVE EMPTY)              │
│                                                     │
│ Build command:           npm run build              │
│                                                     │
│ Publish directory:       dist                       │
│                                                     │
│ Functions directory:     netlify/functions          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## **Environment Variables - What to Add**

After configuring build settings, go to:
**Site Settings → Environment Variables**

Add these variables:

### **REQUIRED Variables**

1. **DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **JWT_SECRET**
   ```
   bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c
   ```

3. **VITE_APP_ENV**
   ```
   production
   ```

4. **FRONTEND_URL**
   ```
   https://himalayanspicesexports.com
   ```

5. **VITE_API_URL**
   ```
   https://himalayanspicesexports.com/api
   ```

### **OPTIONAL Variables** (if using these features)

6. **RAZORPAY_KEY_ID** (for payments)
   ```
   rzp_live_YOUR_KEY_ID
   ```

7. **RAZORPAY_KEY_SECRET** (for payments)
   ```
   your_razorpay_secret
   ```

8. **VITE_RAZORPAY_KEY_ID** (for payments)
   ```
   rzp_live_YOUR_KEY_ID
   ```

9. **SENDGRID_API_KEY** (for emails)
   ```
   SG.YOUR_SENDGRID_KEY
   ```

10. **EMAIL_FROM** (for emails)
    ```
    orders@himalayanspicesexports.com
    ```

11. **VITE_GA_MEASUREMENT_ID** (for analytics)
    ```
    G-YOUR_MEASUREMENT_ID
    ```

---

## **Step-by-Step Netlify Setup**

### **Step 1: Connect Git Repository**
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select GitHub/GitLab
4. Authorize Netlify
5. Select **perfumes** repository

### **Step 2: Configure Build Settings**
1. Fill in the form with values above:
   - Branch: `main`
   - Base directory: (leave empty)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

2. Click "Deploy site"

### **Step 3: Add Environment Variables**
1. Go to **Site Settings** → **Environment Variables**
2. Click "Add a variable"
3. Add each required variable:
   - DATABASE_URL
   - JWT_SECRET
   - VITE_APP_ENV
   - FRONTEND_URL
   - VITE_API_URL

4. Add optional variables if needed

### **Step 4: Trigger Deployment**
1. Go to **Deploys** tab
2. Click "Trigger deploy"
3. Wait for build to complete (~2 minutes)

### **Step 5: Verify Website**
1. Visit https://himalayanspicesexports.com
2. Check browser console (F12) - should be clean
3. Test navigation to different pages

---

## **Common Questions**

### **Q: What if I leave Base directory empty?**
A: Netlify will use the project root (d:\perfumes). This is correct.

### **Q: What does "Publish directory" mean?**
A: This is the folder Netlify serves to visitors. The `dist/` folder contains the built website.

### **Q: Can I change these settings later?**
A: Yes! Go to Site Settings → Build & deploy to change any settings.

### **Q: What if the build fails?**
A: Check the build logs in Netlify dashboard. Common issues:
- Missing environment variables
- Node version mismatch
- Dependency installation errors

### **Q: How long does deployment take?**
A: Usually 2-3 minutes for the build, then instant deployment.

---

## **Troubleshooting**

### **Build Fails**
1. Check build logs in Netlify dashboard
2. Verify all environment variables are set
3. Check Node.js version (should be 18+)

### **Still Seeing 404**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito window
3. Check netlify.toml is in project root

### **API Errors**
1. Verify DATABASE_URL is correct
2. Check JWT_SECRET is set
3. Verify FRONTEND_URL and VITE_API_URL

---

## **Quick Reference**

| Field | Value |
|-------|-------|
| Branch | main |
| Base directory | (empty) |
| Build command | npm run build |
| Publish directory | dist |
| Functions directory | netlify/functions |

---

## **Environment Variables Quick Copy**

```
DATABASE_URL=postgresql://neondb_owner:npg_w3V0EFILtTCP@ep-icy-wildflower-a1qc6oi0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=bbfb4b05f2ad5b7cdc1bdc2c9b15776584293e74d5e72ea8eb9b4fcc410206bfb6d11bf6ae79e7970ff6a127e46c36bfd00d76ad492f38a56d002413bd0aa05c
VITE_APP_ENV=production
FRONTEND_URL=https://himalayanspicesexports.com
VITE_API_URL=https://himalayanspicesexports.com/api
```

---

## **Next Steps**

1. ✅ Fill in build settings with values above
2. ✅ Add environment variables
3. ✅ Click "Deploy site"
4. ✅ Wait for build to complete
5. ✅ Verify website works
6. ✅ Monitor for any issues

---

**Your website will be live in ~5 minutes!** 🚀
