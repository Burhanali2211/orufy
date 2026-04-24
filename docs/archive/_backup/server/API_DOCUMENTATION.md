# API Documentation

## Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

## Authentication
Most endpoints require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Validation:**
- Email: Valid email format, 5-255 characters
- Password: 8-100 characters, must contain uppercase, lowercase, and number
- Name: 2-100 characters (optional)
- Phone: Valid international format (optional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

---

## Product Endpoints

### GET /products
Get list of products with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page, 1-100 (default: 20)
- `category` (uuid, optional): Filter by category ID
- `search` (string, optional): Search in product name/description
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `sortBy` (enum, optional): `price_asc`, `price_desc`, `name_asc`, `name_desc`, `newest`, `popular`
- `featured` (boolean, optional): Filter featured products

**Example:**
```
GET /products?page=1&limit=20&category=uuid&minPrice=100&maxPrice=1000&sortBy=price_asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Premium Attar",
      "slug": "premium-attar",
      "description": "High quality attar...",
      "price": 599.00,
      "originalPrice": 799.00,
      "images": ["url1", "url2"],
      "stock": 50,
      "category": {
        "id": "uuid",
        "name": "Floral Attars"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /products/:id
Get single product by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Premium Attar",
    "slug": "premium-attar",
    "description": "Detailed description...",
    "shortDescription": "Brief description...",
    "price": 599.00,
    "originalPrice": 799.00,
    "images": ["url1", "url2"],
    "stock": 50,
    "sku": "ATT-001",
    "tags": ["floral", "premium"],
    "specifications": {
      "volume": "12ml",
      "origin": "India"
    },
    "category": {
      "id": "uuid",
      "name": "Floral Attars"
    },
    "reviews": []
  }
}
```

### POST /products
Create new product (Admin/Seller only).

**Authentication:** Required (Admin or Seller role)

**Request Body:**
```json
{
  "name": "New Attar",
  "slug": "new-attar",
  "description": "Product description...",
  "shortDescription": "Brief description...",
  "price": 599.00,
  "originalPrice": 799.00,
  "categoryId": "uuid",
  "images": ["url1", "url2"],
  "stock": 100,
  "sku": "ATT-002",
  "tags": ["floral"],
  "specifications": {},
  "showOnHomepage": true
}
```

**Validation:**
- Name: 3-255 characters (required)
- Price: Positive number, max 1,000,000 (required)
- Images: Array of URLs, 1-10 items
- Stock: Integer, 0-100,000

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Attar",
    "slug": "new-attar",
    "price": 599.00,
    "stock": 100
  }
}
```

---

## Cart Endpoints

### GET /cart
Get current user's cart.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Premium Attar",
          "price": 599.00,
          "images": ["url"]
        },
        "quantity": 2,
        "subtotal": 1198.00
      }
    ],
    "total": 1198.00,
    "itemCount": 2
  }
}
```

### POST /cart
Add item to cart.

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 2
}
```

**Validation:**
- productId: Valid UUID (required)
- variantId: Valid UUID (optional)
- quantity: Integer, 1-100 (required)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": 2
  }
}
```

### PUT /cart/:id
Update cart item quantity.

**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": 3
  }
}
```

### DELETE /cart/:id
Remove item from cart.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Order Endpoints

### GET /orders
Get user's orders.

**Authentication:** Required

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page, 1-100
- `status` (enum, optional): `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- `paymentStatus` (enum, optional): `pending`, `paid`, `failed`, `refunded`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-1234567890",
      "status": "confirmed",
      "paymentStatus": "paid",
      "totalAmount": 1298.00,
      "items": [
        {
          "product": {
            "name": "Premium Attar",
            "images": ["url"]
          },
          "quantity": 2,
          "price": 599.00
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "+919876543210",
        "addressLine1": "123 Main St",
        "city": "Srinagar",
        "state": "Jammu & Kashmir",
        "postalCode": "190001"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### POST /orders
Create new order.

**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "quantity": 2,
      "price": 599.00
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+919876543210",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Srinagar",
    "state": "Jammu & Kashmir",
    "postalCode": "190001",
    "country": "India"
  },
  "billingAddress": {
    // Same structure as shippingAddress (optional)
  },
  "paymentMethod": "razorpay",
  "notes": "Please deliver before 5 PM"
}
```

**Validation:**
- items: Array, 1-50 items (required)
- shippingAddress: Complete address object (required)
- paymentMethod: `razorpay`, `cod`, or `upi` (default: razorpay)
- notes: Max 500 characters (optional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1234567890",
    "status": "pending",
    "paymentStatus": "pending",
    "totalAmount": 1298.00
  }
}
```

---

## Payment Endpoints (Razorpay)

### POST /razorpay/create-order
Create Razorpay payment order.

**Authentication:** Required
**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "amount": 1298.00,
  "currency": "INR",
  "receipt": "ORD-1234567890",
  "notes": {
    "orderId": "uuid"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order_razorpay_id",
    "amount": 129800,
    "currency": "INR",
    "receipt": "ORD-1234567890"
  }
}
```

### POST /razorpay/verify-payment
Verify Razorpay payment signature.

**Authentication:** Required
**Rate Limit:** 10 requests per 15 minutes

**Request Body:**
```json
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "uuid",
    "paymentStatus": "paid"
  }
}
```

---

## Error Responses

All errors follow a consistent format:

**Validation Error (400):**
```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "email: Invalid email address, password: Password must be at least 8 characters",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/auth/register",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email address",
          "code": "invalid_string"
        }
      ]
    }
  }
}
```

**Authentication Error (401):**
```json
{
  "error": {
    "status": 401,
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/cart"
  }
}
```

**Authorization Error (403):**
```json
{
  "error": {
    "status": 403,
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/admin/products"
  }
}
```

**Not Found Error (404):**
```json
{
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Product not found",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/products/invalid-uuid"
  }
}
```

**Rate Limit Error (429):**
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "15 minutes"
}
```

**Server Error (500):**
```json
{
  "error": {
    "status": 500,
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Our team has been notified.",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/orders"
  }
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Registration | 3 requests | 1 hour |
| Password Reset | 3 requests | 1 hour |
| Checkout/Payment | 10 requests | 15 minutes |
| Webhooks | 100 requests | 15 minutes |
| Admin Endpoints | 200 requests | 15 minutes |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Missing/Invalid Token) |
| 403 | Forbidden (Insufficient Permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., Insufficient Stock) |
| 429 | Too Many Requests (Rate Limit) |
| 500 | Internal Server Error |

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle rate limits gracefully** - implement exponential backoff
3. **Validate data client-side** before sending to reduce errors
4. **Use pagination** for list endpoints to improve performance
5. **Check error responses** and display user-friendly messages
6. **Store JWT tokens securely** (httpOnly cookies or secure storage)
7. **Implement retry logic** for network failures
8. **Log errors** for debugging and monitoring
