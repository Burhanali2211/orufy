# Image Display Fix - Routing Issue

## Problem

Images were uploading successfully to the database, but **not displaying** on the website.

**Root Cause:** Netlify's redirect rules were sending `/uploads/*` requests to the SPA (`index.html`) instead of routing them to the API function where images are served from the database.

## Solution Applied

### 1. Added Redirect Rule for `/uploads/*` ✅

**File: `netlify.toml`**

Added a redirect rule to send `/uploads/*` requests to the API function:

```toml
# Uploaded images are served by the API function (from database)
[[redirects]]
  from = "/uploads/*"
  to = "/.netlify/functions/api/uploads/:splat"
  status = 200
  force = true
```

### 2. Updated Path Transformation ✅

**File: `netlify/functions/api.ts`**

Updated the path transformation logic to preserve `/uploads/*` paths:

```typescript
// Don't modify /uploads paths - they should go directly to Express
if (modifiedPath.startsWith('/uploads')) {
  modifiedPath = originalPath; // Keep as-is
} else if (!modifiedPath.startsWith('/api')) {
  modifiedPath = `/api${modifiedPath}`; // Prepend /api for other paths
}
```

## How It Works Now

### Request Flow:
```
1. Frontend requests: GET /uploads/products/image.jpg
2. Netlify redirects to: /.netlify/functions/api/uploads/products/image.jpg
3. Netlify Function receives: /uploads/products/image.jpg (function name stripped)
4. Path transformation: Keeps /uploads/products/image.jpg (no /api prepended)
5. Express middleware: Matches /uploads route
6. Database lookup: Finds image by url_path
7. Response: Sends image buffer with proper headers
```

### Image Serving:
```
GET /uploads/products/image.jpg
  ↓
Netlify redirects to API function
  ↓
Express /uploads middleware
  ↓
Database query: SELECT * FROM uploaded_files WHERE url_path = '/uploads/products/image.jpg'
  ↓
Convert base64 to buffer
  ↓
Send image with Content-Type header
```

## Changes Made

### Files Modified:

1. **`netlify.toml`**
   - Added redirect rule for `/uploads/*` to API function
   - Ensures image requests reach Express middleware

2. **`netlify/functions/api.ts`**
   - Updated path transformation to preserve `/uploads` paths
   - Prevents `/api` prefix from being added to upload routes

## Testing

### Test Image Upload:
1. Upload an image in admin dashboard
2. Image should be stored in database
3. URL returned: `/uploads/products/1234567890-abc123.jpg`

### Test Image Display:
1. Frontend requests: `https://himalayanspicesexports.com/uploads/products/1234567890-abc123.jpg`
2. Netlify redirects to API function
3. Express serves image from database
4. Image displays correctly ✅

### Verify:
```bash
# Test image URL directly
curl -I https://himalayanspicesexports.com/uploads/products/image.jpg

# Should return:
# HTTP/2 200
# Content-Type: image/jpeg
# Content-Length: [size]
```

## Summary

✅ **Fixed**: Images now route correctly to API function
✅ **Database Serving**: Images served from database via Express
✅ **Path Handling**: `/uploads/*` paths preserved correctly
✅ **Display**: Images should now display on website

## Next Steps

1. **Deploy:**
   ```bash
   git add netlify.toml netlify/functions/api.ts
   git commit -m "Fix: Route /uploads/* to API function for image serving"
   git push origin main
   ```

2. **Test:**
   - Upload an image in admin dashboard
   - Verify image displays on website
   - Check browser network tab for image requests

3. **Verify:**
   - Images should load from database
   - No 404 errors for image URLs
   - Images display correctly in product cards, etc.

The image display issue should now be resolved! Images will be served from the database through the Express API function.

