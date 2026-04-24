# 🚀 Netlify Node.js Version Setup

## Quick Fix (2 Steps)

### Step 1: Go to Netlify Dashboard
```
https://app.netlify.com
→ Select "himalayanspicesexports" site
→ Go to "Site Settings" tab
→ Click "Build & deploy" in left menu
→ Click "Environment" section
```

### Step 2: Set Node.js Version
```
Find: Node.js version field
Change from: 18.17.0
Change to: 20.19.0
Click: Save
```

### Step 3: Clear Cache and Redeploy
```
Go to "Deploys" tab
Click "Clear cache and redeploy"
Wait for build to complete
```

---

## Visual Guide

```
Netlify Dashboard
├── Site Settings
│   ├── Build & deploy
│   │   ├── Environment
│   │   │   ├── Node.js version: 20.19.0 ← SET THIS
│   │   │   └── NPM version: 10.8.0
│   │   └── Save
│   └── Deploys
│       └── Clear cache and redeploy ← CLICK THIS
```

---

## Expected Result

✅ Build succeeds
✅ Website deploys
✅ No Node.js errors

---

## If You Can't Find Node.js Version Field

Use Environment Variables instead:

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

**Your website will be live in ~5 minutes!** 🚀
