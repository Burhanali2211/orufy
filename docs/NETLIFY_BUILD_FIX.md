# Netlify Build Fix - TypeScript Compiler Not Found

## Problem

Build failed with error:
```
sh: 1: tsc: not found
```

## Root Cause

1. **TypeScript is in devDependencies** - Required for building the server
2. **NODE_ENV=production** - When set, `npm install`/`npm ci` skips devDependencies
3. **tsc command not found** - TypeScript compiler not available because dev dependencies weren't installed

## Solution Applied

### 1. Updated `package.json`
Changed build scripts to use `npx tsc` instead of `tsc`:
```json
"build:server": "npx tsc --project server/tsconfig.json"
```

### 2. Updated `netlify.toml`
- Added Node.js version specification (20.19.0)
- Changed build command to install dev dependencies:
```toml
[build]
  command = "npm install --production=false && npm run build"
  
[build.environment]
  NODE_VERSION = "20.19.0"
  NPM_VERSION = "10.8.0"
```

### 3. Created `.nvmrc`
Added Node.js version file for consistency:
```
20.19.0
```

## Changes Made

### Files Modified:
1. ✅ `package.json` - Updated build scripts to use `npx tsc`
2. ✅ `netlify.toml` - Updated build command and added Node version
3. ✅ `.nvmrc` - Created for Node version specification

## How It Works Now

1. **Install Phase**: `npm install --production=false`
   - Installs ALL dependencies including devDependencies
   - TypeScript and other build tools are available

2. **Build Phase**: `npm run build`
   - Runs `npm run build:server` (compiles TypeScript)
   - Runs `npx vite build` (builds frontend)
   - Both succeed because TypeScript is installed

## Next Steps

1. **Commit the changes**:
   ```bash
   git add package.json netlify.toml .nvmrc
   git commit -m "Fix: Ensure dev dependencies are installed for Netlify build"
   git push origin main
   ```

2. **Netlify will automatically deploy** when you push

3. **Monitor the build**:
   - Go to Netlify Dashboard → Deploys
   - Watch the build logs
   - Should see: `npm install` installing TypeScript
   - Should see: `npx tsc` compiling server code
   - Build should complete successfully

## Expected Build Output

### Before ❌
```
sh: 1: tsc: not found
Build failed
```

### After ✅
```
✅ npm install (includes devDependencies)
✅ npx tsc --project server/tsconfig.json (compiles server)
✅ npx vite build (builds frontend)
✅ Build succeeds
✅ Website deploys
```

## Verification Checklist

After deployment:
- [ ] Build completes without errors
- [ ] No "tsc: not found" error
- [ ] Server code compiles successfully
- [ ] Frontend builds successfully
- [ ] Website deploys correctly
- [ ] API endpoints work (test `/api/health`)

## Alternative Solution (If Above Doesn't Work)

If `--production=false` doesn't work, use this in `netlify.toml`:

```toml
[build]
  command = "NODE_ENV=development npm install && NODE_ENV=production npm run build"
```

This temporarily sets NODE_ENV to development during install, then back to production for the build.

## Technical Details

### Why This Happened
- Netlify sets `NODE_ENV=production` by default
- `npm install` with `NODE_ENV=production` skips devDependencies
- TypeScript is in devDependencies
- Build script needs TypeScript to compile server code
- Build fails because TypeScript isn't available

### The Fix
- `--production=false` flag forces npm to install devDependencies
- `npx tsc` uses locally installed TypeScript from node_modules
- Node version specified ensures compatibility

## Summary

✅ **Fixed**: Build command now installs dev dependencies
✅ **Fixed**: Using `npx tsc` to find TypeScript
✅ **Fixed**: Node.js version specified (20.19.0)
✅ **Ready**: Build should work now!

