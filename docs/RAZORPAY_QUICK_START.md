# Razorpay Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Configuration (1 min)

Check your `.env` file has these keys:

```env
# Backend
RAZORPAY_KEY_ID=rzp_test_RZzoVREgGy9kn6
RAZORPAY_KEY_SECRET=aIQzIZch3IumJ1Hvn2ZuqlgV
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend
VITE_RAZORPAY_KEY_ID=rzp_test_RZzoVREgGy9kn6
VITE_API_URL=http://localhost:5000/api
```

### Step 2: Apply Database Migration (1 min)

```bash
# Connect to your PostgreSQL database
psql -U postgres -d sufi_essences

# Run the migration
\i server/db/migrations/add_razorpay_payment_fields.sql

# Verify tables were created
\dt payment_logs
\d orders
```

### Step 3: Start Services (1 min)

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### Step 4: Test Payment Flow (2 min)

1. **Open browser:** http://localhost:5173
2. **Login** with your account
3. **Add items** to cart
4. **Go to checkout**
5. **Fill shipping details**
6. **Select payment method:** "Credit/Debit Cards"
7. **Click "Pay"**
8. **Use test card:** `4111111111111111`
9. **Enter expiry:** Any future date (e.g., 12/25)
10. **Enter CVV:** Any 3 digits (e.g., 123)
11. **Click "Pay"**

### Expected Result ✅

- Payment modal closes
- Order confirmation page appears
- Order status shows "confirmed"
- Payment status shows "completed"

## 🧪 Quick Test Scenarios

### Test 1: Successful Payment (Card)
```
Card: 4111111111111111
Expiry: 12/25
CVV: 123
Result: ✅ Success
```

### Test 2: Failed Payment (Card)
```
Card: 4000000000000002
Expiry: 12/25
CVV: 123
Result: ❌ Failure (Expected)
```

### Test 3: UPI Payment
```
UPI ID: success@razorpay
Result: ✅ Success
```

### Test 4: Cash on Delivery
```
Select: Cash on Delivery
Click: Place Order
Result: ✅ Order created (no payment modal)
```

## 🔍 Verify Payment in Database

```sql
-- Check latest order
SELECT id, order_number, status, payment_status, razorpay_payment_id 
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 1;

-- Check payment logs
SELECT event_type, status, amount, created_at 
FROM public.payment_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

## 📊 Check Console Logs

Open browser DevTools (F12) → Console tab

**Look for these logs:**
```
✅ Initiating payment: {amount: ..., currency: "INR", method: "card"}
✅ Order created successfully: {orderId: "order_..."}
✅ Opening Razorpay checkout...
✅ Payment response received: {orderId: "order_...", paymentId: "pay_..."}
✅ Payment verified successfully: {paymentId: "pay_...", status: "captured"}
```

## ⚠️ Common Issues & Fixes

### Issue: "Payment service is not configured"
**Fix:** Check `.env` file has RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

### Issue: "Razorpay SDK not loaded"
**Fix:** Check browser console, refresh page, verify internet connection

### Issue: "Invalid payment signature"
**Fix:** Verify RAZORPAY_KEY_SECRET is correct in `.env`

### Issue: "Authentication token not found"
**Fix:** Login again, check if token is stored in localStorage

### Issue: Order not created after payment
**Fix:** Check backend logs, verify database connection, check payment_logs table

## 📱 Mobile Testing

### iOS
```
1. Open on iPhone Safari
2. Add items to cart
3. Go to checkout
4. Select payment method
5. Click Pay
6. Complete payment in modal
```

### Android
```
1. Open on Android Chrome
2. Add items to cart
3. Go to checkout
4. Select payment method
5. Click Pay
6. Complete payment in modal
```

## 🔐 Security Checklist

- [x] Signature verification implemented
- [x] Amount validation implemented
- [x] Payment status verification implemented
- [x] Authentication required on all endpoints
- [x] Timing-safe comparison used
- [x] Audit trail logging implemented
- [x] Error handling comprehensive
- [x] HTTPS ready for production

## 📚 Full Documentation

For detailed information, see:
- **Integration Guide:** `docs/RAZORPAY_INTEGRATION_GUIDE.md`
- **Testing Guide:** `docs/RAZORPAY_TESTING_GUIDE.md`
- **Implementation Summary:** `docs/RAZORPAY_IMPLEMENTATION_SUMMARY.md`

## 🚀 Production Deployment

When ready for production:

1. **Get Live Keys**
   - Go to https://dashboard.razorpay.com/app/keys
   - Copy live Key ID and Key Secret

2. **Update .env**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Configure Webhook**
   - Go to https://dashboard.razorpay.com/app/webhooks
   - Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
   - Select events: payment.authorized, payment.failed, refund.created
   - Copy webhook secret to RAZORPAY_WEBHOOK_SECRET

4. **Enable HTTPS**
   - Install SSL certificate
   - Update all URLs to HTTPS

5. **Test Complete Flow**
   - Test with live cards
   - Verify webhook events
   - Check payment logs

6. **Monitor & Alert**
   - Set up error monitoring
   - Configure payment alerts
   - Monitor failed payments

## 💡 Tips

1. **Always test with test keys first** - Never use live keys in development
2. **Check console logs** - Helps identify issues quickly
3. **Monitor payment_logs table** - Audit trail for all payments
4. **Use test cards** - Provided by Razorpay for testing
5. **Read error messages** - They usually indicate the issue
6. **Keep keys secure** - Never commit .env to git
7. **Test on mobile** - Ensure responsive design works

## 🆘 Need Help?

1. Check console logs (F12)
2. Check backend logs
3. Query payment_logs table
4. Review documentation
5. Contact Razorpay support: https://razorpay.com/support

## ✅ Verification Checklist

- [ ] .env configured with test keys
- [ ] Database migration applied
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can add items to cart
- [ ] Can proceed to checkout
- [ ] Payment modal opens
- [ ] Test card payment succeeds
- [ ] Order created in database
- [ ] Payment status shows "completed"
- [ ] Order confirmation page appears

---

**Ready to test?** Start with Step 1 above! 🎉

