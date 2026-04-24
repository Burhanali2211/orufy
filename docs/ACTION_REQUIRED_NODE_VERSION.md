# ⚠️ ACTION REQUIRED - Set Node.js Version in Netlify

## What You Need to Do RIGHT NOW

Netlify is still using Node.js 18.17.0. You need to manually set it to 20.19.0 in the Netlify Dashboard.

---

## 3-Minute Fix

### Step 1: Open Netlify Dashboard
```
https://app.netlify.com
```

### Step 2: Select Your Site
```
Click on "himalayanspicesexports" site
```

### Step 3: Go to Site Settings
```
Click "Site Settings" tab
```

### Step 4: Set Node.js Version
```
Left menu → "Build & deploy"
Click "Environment" section
Find "Node.js version" field
Change: 18.17.0 → 20.19.0
Click "Save"
```

### Step 5: Redeploy
```
Go to "Deploys" tab
Click "Clear cache and redeploy"
Wait for build to complete
```

---

## That's It!

Your website will be live in ~5 minutes.

---

## If You Can't Find Node.js Version Field

Use this alternative:

```
Site Settings
→ Environment Variables
→ Add a variable
  Name: NODE_VERSION
  Value: 20.19.0
→ Save
→ Go to Deploys
→ Clear cache and redeploy
```

---

## Verification

After deployment:
- Visit https://himalayanspicesexports.com
- Should see home page (not 404)
- Check browser console (F12) - should be clean

---

**Go to Netlify Dashboard NOW!** 🚀

https://app.netlify.com
