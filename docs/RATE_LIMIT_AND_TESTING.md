# Rate Limiting and Testing Guide

## Rate Limit Configuration

The auth endpoints have strict rate limiting:
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **General API**: 100 requests per 15 minutes per IP

## Current Issue

You've hit the rate limit from testing:
```
"Too many authentication attempts"
"Please try again in 15 minutes"
```

## Solutions

### Option 1: Wait 15 Minutes
The rate limit resets after 15 minutes. Wait and try again.

### Option 2: Use Different IP
- Use a VPN
- Test from a different network
- Use a mobile hotspot

### Option 3: Test with Existing Users
Instead of creating new test users, use existing ones:
- `customer@example.com` / `admin123`
- `admin@example.com` / `admin123`
- `seller@example.com` / `admin123`

### Option 4: Temporarily Increase Rate Limit (Development Only)

For testing, you can temporarily increase the rate limit by setting environment variables in Netlify:
- `RATE_LIMIT_LOGIN_MAX=50` (instead of 5)
- `RATE_LIMIT_WINDOW_MS=60000` (1 minute instead of 15)

**⚠️ Remember to set it back to production values after testing!**

## Windows Testing Commands

### Method 1: Using curl with JSON file (Recommended)
```cmd
curl -X POST https://himalayanspicesexports.com/api/auth/login -H "Content-Type: application/json" -d @test-login.json
```

### Method 2: Using PowerShell
```powershell
.\test-login.ps1
```

### Method 3: Using batch file
```cmd
test-login.bat
```

### Method 4: Single-line curl (Windows CMD)
```cmd
curl -X POST https://himalayanspicesexports.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"testuser@example.com\",\"password\":\"Test123!\"}"
```

## Test Users Available

### Existing Users (No rate limit if successful):
- `customer@example.com` / `admin123`
- `admin@example.com` / `admin123`
- `seller@example.com` / `admin123`

### Test User Created:
- `testuser@example.com` / `Test123!`

## Checking Rate Limit Status

The rate limit is stored in memory (express-rate-limit default). To check:
1. Wait 15 minutes
2. Try again
3. Check response headers for `RateLimit-*` headers

## Bypassing Rate Limit for Testing

If you need to test immediately, you can:

1. **Temporarily disable rate limiting** (NOT recommended for production):
   - Comment out `authLimiter` in `server/routes/auth.ts`
   - Deploy
   - Test
   - Re-enable

2. **Increase rate limit** (Better approach):
   - Set `RATE_LIMIT_LOGIN_MAX=100` in Netlify environment variables
   - Deploy
   - Test
   - Set back to 5

3. **Use different endpoint**:
   - Test registration instead (different rate limit)
   - Or test other endpoints that don't have strict limits

## Next Steps

1. **Wait 15 minutes** for rate limit to reset
2. **Use PowerShell script** (`test-login.ps1`) for easier testing
3. **Test with existing users** that have correct passwords
4. **Check Netlify function logs** to see if body parsing is working

## Summary

✅ **Rate limit is working** - This is good security!
⏰ **Wait 15 minutes** - Rate limit will reset
📝 **Use provided scripts** - Easier testing on Windows
🔍 **Check logs** - Verify body parsing after rate limit resets

