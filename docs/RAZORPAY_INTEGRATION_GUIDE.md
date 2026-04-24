# Razorpay Payment Integration Guide

## Overview

This document describes the complete Razorpay payment integration for the HimalayanSpicesExportss e-commerce platform. The integration follows Razorpay's official documentation and implements security best practices.

**Reference:** https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

## Architecture

### Payment Flow

```
1. Customer initiates payment
   ↓
2. Frontend creates Razorpay order via backend API
   ↓
3. Razorpay checkout modal opens
   ↓
4. Customer completes payment
   ↓
5. Razorpay returns payment response
   ↓
6. Frontend verifies payment signature on backend
   ↓
7. Backend updates order status
   ↓
8. Order confirmation sent to customer
```

## Configuration

### Environment Variables

```env
# Backend
RAZORPAY_KEY_ID=rzp_test_RZzoVREgGy9kn6
RAZORPAY_KEY_SECRET=aIQzIZch3IumJ1Hvn2ZuqlgV
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend
VITE_RAZORPAY_KEY_ID=rzp_test_RZzoVREgGy9kn6
VITE_API_URL=http://localhost:5000/api
```

### Get Your Keys

1. Go to https://dashboard.razorpay.com/app/keys
2. Copy your Key ID and Key Secret
3. Add them to `.env` file
4. For webhooks, go to Settings → Webhooks and create a new webhook

## API Endpoints

### 1. Create Order

**Endpoint:** `POST /api/razorpay/create-order`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "amount": 1500.50,
  "currency": "INR",
  "receipt": "receipt_1234567890",
  "notes": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "items_count": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890abcd",
    "amount": 150050,
    "currency": "INR",
    "receipt": "receipt_1234567890"
  }
}
```

### 2. Verify Payment

**Endpoint:** `POST /api/razorpay/verify-payment`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "razorpay_order_id": "order_1234567890abcd",
  "razorpay_payment_id": "pay_1234567890abcd",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "paymentId": "pay_1234567890abcd",
    "orderId": "order_1234567890abcd",
    "status": "captured",
    "method": "card",
    "amount": 1500.50,
    "email": "john@example.com",
    "contact": "+919876543210"
  }
}
```

### 3. Get Payment Details

**Endpoint:** `GET /api/razorpay/payment/:paymentId`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pay_1234567890abcd",
    "orderId": "order_1234567890abcd",
    "status": "captured",
    "method": "card",
    "amount": 1500.50,
    "currency": "INR",
    "email": "john@example.com",
    "contact": "+919876543210",
    "createdAt": 1234567890
  }
}
```

### 4. Create Refund

**Endpoint:** `POST /api/razorpay/refund`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "paymentId": "pay_1234567890abcd",
  "amount": 500.00,
  "notes": {
    "reason": "Customer requested refund"
  }
}
```

## Security Features

### 1. Signature Verification

All payments are verified using HMAC-SHA256 signature verification:

```typescript
const generatedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(generatedSignature),
  Buffer.from(receivedSignature)
);
```

### 2. Timing-Safe Comparison

Uses `crypto.timingSafeEqual()` to prevent timing attacks.

### 3. Amount Validation

- Validates amount is greater than 0
- Validates amount doesn't exceed maximum limit (₹10,00,000)
- Verifies payment amount matches order amount

### 4. Payment Status Verification

- Verifies payment status is "captured" before confirming
- Updates order status only after verification
- Logs all payment events for audit trail

### 5. Authentication

- All endpoints require JWT authentication
- User ID is extracted from token and validated
- Payment can only be verified by the user who initiated it

## Database Schema

### Orders Table Updates

```sql
ALTER TABLE public.orders 
ADD COLUMN razorpay_order_id TEXT;
ADD COLUMN razorpay_payment_id TEXT;
ADD COLUMN payment_method_details JSONB;
```

### Payment Logs Table

```sql
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  event_type TEXT,
  status TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);
```

## Frontend Implementation

### RazorpayPayment Component

Located at: `src/components/Payment/RazorpayPayment.tsx`

**Features:**
- Multiple payment methods (Card, UPI, Net Banking, Wallets, COD)
- Real-time order summary with GST and shipping
- Secure payment verification
- Comprehensive error handling
- Mobile-responsive design

**Usage:**
```tsx
<RazorpayPayment
  amount={1500.50}
  items={cartItems}
  customerInfo={{
    name: "John Doe",
    email: "john@example.com",
    phone: "+919876543210"
  }}
  shippingAddress={{
    street: "123 Main St",
    city: "Srinagar",
    state: "Jammu & Kashmir",
    zipCode: "190001",
    country: "India"
  }}
  onSuccess={(paymentId) => handleSuccess(paymentId)}
  onError={(error) => handleError(error)}
  onCancel={() => handleCancel()}
/>
```

## Testing

### Test Credentials

**Key ID:** `rzp_test_RZzoVREgGy9kn6`
**Key Secret:** `aIQzIZch3IumJ1Hvn2ZuqlgV`

### Test Cards

| Card Number | Expiry | CVV | Status |
|-------------|--------|-----|--------|
| 4111111111111111 | Any future date | Any 3 digits | Success |
| 4000000000000002 | Any future date | Any 3 digits | Failure |

### Test UPI

- UPI ID: `success@razorpay` (Success)
- UPI ID: `failure@razorpay` (Failure)

## Webhook Events

### Supported Events

1. **payment.authorized** - Payment authorized
2. **payment.failed** - Payment failed
3. **refund.created** - Refund created

### Webhook Endpoint

**URL:** `POST /api/razorpay/webhook`

**Headers:**
```
X-Razorpay-Signature: <signature>
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if JWT token is valid
   - Verify token is being sent in Authorization header

2. **Invalid Signature**
   - Verify RAZORPAY_KEY_SECRET is correct
   - Check if order ID and payment ID are correct

3. **Payment Not Captured**
   - Verify payment status is "captured" in Razorpay dashboard
   - Check if payment was authorized but not captured

4. **SDK Not Loaded**
   - Verify Razorpay script is loaded in index.html
   - Check browser console for errors

## Production Deployment

### Before Going Live

1. [ ] Update to live Razorpay keys
2. [ ] Update FRONTEND_URL in .env
3. [ ] Configure webhook URL in Razorpay dashboard
4. [ ] Set RAZORPAY_WEBHOOK_SECRET
5. [ ] Enable HTTPS
6. [ ] Test complete payment flow
7. [ ] Set up monitoring and alerts
8. [ ] Configure backup payment methods

### Live Keys

Get your live keys from: https://dashboard.razorpay.com/app/keys

Update `.env`:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

## Support

For issues or questions:
- Razorpay Support: https://razorpay.com/support
- Documentation: https://razorpay.com/docs
- Dashboard: https://dashboard.razorpay.com

