# Razorpay Payment Setup Guide

## Quick Fix for "Payment service is not configured" Error

This error occurs when Razorpay API credentials are not set in your environment variables.

## Steps to Fix

### 1. Create or Update `.env` File

Create a `.env` file in the project root (same directory as `package.json`) if it doesn't exist, or add these variables to your existing `.env` file:

```env
# Razorpay Payment Gateway Configuration
# Get these from: https://dashboard.razorpay.com/app/keys

# Backend API Keys (Required for server)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here

# Frontend Public Key (Required for client-side payment)
# This should be the same as RAZORPAY_KEY_ID
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Optional: Webhook Secret (for webhook verification)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Get Your Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. If you don't have keys yet:
   - Click **Generate Test Key** for testing
   - Or **Generate Live Key** for production
4. Copy the **Key ID** and **Key Secret**
5. Paste them into your `.env` file

### 3. Restart Your Server

After adding the environment variables:

1. **Stop** your development server (Ctrl+C)
2. **Restart** the server:
   ```bash
   npm run dev:server
   ```
   or
   ```bash
   npm run dev:all
   ```

### 4. Verify Configuration

The server will now:
- ✅ Load Razorpay credentials on startup
- ✅ Create payment orders successfully
- ✅ Process payment verifications
- ✅ Handle refunds

## Environment Variables Explained

| Variable | Required For | Description |
|----------|-------------|-------------|
| `RAZORPAY_KEY_ID` | Backend | Your Razorpay Key ID (starts with `rzp_test_` or `rzp_live_`) |
| `RAZORPAY_KEY_SECRET` | Backend | Your Razorpay Secret Key (keep this secure!) |
| `VITE_RAZORPAY_KEY_ID` | Frontend | Same as `RAZORPAY_KEY_ID` (for client-side payment widget) |
| `RAZORPAY_WEBHOOK_SECRET` | Backend (Optional) | Webhook signature verification secret |

## Testing vs Production Keys

- **Test Keys** (`rzp_test_...`): Use for development and testing
- **Live Keys** (`rzp_live_...`): Use for production (real payments)

⚠️ **Important**: Never commit your `.env` file to git! It contains sensitive credentials.

## Troubleshooting

### Error: "Payment service is not configured"

**Solution**: Make sure you've:
1. Added `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`
2. Restarted the server after adding the variables
3. The `.env` file is in the project root directory

### Error: "Payment service not configured" (Frontend)

**Solution**: Make sure you've:
1. Added `VITE_RAZORPAY_KEY_ID` to `.env`
2. Restarted the frontend dev server (Vite needs restart to load new env vars)

### Still Not Working?

1. Check that your `.env` file is in the root directory (same level as `package.json`)
2. Verify there are no typos in variable names
3. Make sure there are no spaces around the `=` sign in `.env` file
4. Check server logs for detailed error messages

## Example `.env` File

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-jwt-secret-here

# Razorpay (Add these)
RAZORPAY_KEY_ID=rzp_test_1234567890ABCD
RAZORPAY_KEY_SECRET=abcdefghijklmnopqrstuvwxyz123456
VITE_RAZORPAY_KEY_ID=rzp_test_1234567890ABCD
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Need Help?

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com
- Check server logs for detailed error messages

