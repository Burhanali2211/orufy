# Netlify 404 Fix - GET Request to Login Endpoint

## Problem

Accessing `/api/auth/login` via browser (GET request) returns 404 error:
```json
{
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Cannot GET /api/auth/login",
    "userMessage": "The requested endpoint does not exist."
  }
}
```

## Root Cause

The login route (`/api/auth/login`) only accepts **POST** requests, but browsers make **GET** requests when you visit a URL directly. Since there was no GET handler, the request fell through to the 404 handler.

## Solution Applied

### 1. Added GET Handler for Login Route

Added a GET handler that returns a helpful 405 Method Not Allowed response:

**File: `server/routes/auth.ts`**

```typescript
/**
 * GET /api/auth/login
 * Returns information about the login endpoint (for browser access)
 */
router.get(
  '/login',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(405).json({
      error: {
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method is not allowed for /api/auth/login',
        userMessage: 'This endpoint only accepts POST requests. Please use POST method with email and password in the request body.',
        allowedMethods: ['POST'],
        example: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: 'user@example.com',
            password: 'your-password'
          }
        }
      }
    });
  })
);
```

### 2. Added Debug Logging

Added debug logging in the Netlify function to track path transformation:

**File: `netlify/functions/api.ts`**

- Logs original path, HTTP method, and path parameters
- Logs modified path after transformation
- Helps debug routing issues

## Expected Behavior

### Before Fix ❌
```
GET /api/auth/login
→ 404 NOT_FOUND
→ "The requested endpoint does not exist."
```

### After Fix ✅
```
GET /api/auth/login
→ 405 METHOD_NOT_ALLOWED
→ "This endpoint only accepts POST requests..."
→ Includes example of how to use the endpoint
```

## Testing

### Test GET Request (Browser)
1. Visit: `https://himalayanspicesexports.com/api/auth/login`
2. Should return: 405 Method Not Allowed with helpful message
3. Should NOT return: 404 Not Found

### Test POST Request (API)
1. POST to: `https://himalayanspicesexports.com/api/auth/login`
2. Body: `{"email":"user@example.com","password":"pass123"}`
3. Should return: 200 with user data and token

## Why This Matters

1. **Better UX**: Users get helpful error messages instead of confusing 404s
2. **API Documentation**: GET handler provides endpoint information
3. **Debugging**: Clear indication that method is wrong, not that endpoint doesn't exist
4. **Standards**: Proper HTTP status code (405) instead of 404

## Next Steps

1. **Deploy the fix:**
   ```bash
   git add server/routes/auth.ts netlify/functions/api.ts
   git commit -m "Fix: Add GET handler for login endpoint to return 405 instead of 404"
   git push origin main
   ```

2. **Test in browser:**
   - Visit the URL
   - Should see helpful 405 error message

3. **Verify POST still works:**
   - Test actual login functionality
   - Should work as before

## Summary

✅ **Fixed**: Added GET handler for `/api/auth/login`
✅ **Improved**: Returns 405 Method Not Allowed instead of 404
✅ **Added**: Helpful error message with usage example
✅ **Added**: Debug logging for path transformation
✅ **Ready**: Better error handling for API endpoints

