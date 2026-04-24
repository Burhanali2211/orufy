# API Documentation

## Base URL
```
https://www.himalayanspicesexports.com/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Products
- `GET /products` - List products with pagination
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin/seller)
- `PUT /products/:id` - Update product (admin/seller)
- `DELETE /products/:id` - Delete product (admin/seller)

### Categories
- `GET /categories` - List categories
- `GET /categories/:id` - Get category details

### Authentication
- `POST /auth/login` - Login
- `POST /auth/signup` - Register
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token

### Orders
- `GET /orders` - List user orders
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `DELETE /orders/:id` - Cancel order

### Cart
- `GET /cart` - Get cart
- `POST /cart/add` - Add to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/remove` - Remove from cart

### Payments
- `POST /razorpay/create-order` - Create Razorpay order
- `POST /razorpay/verify-payment` - Verify payment

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "status": 400,
    "code": "ERROR_CODE",
    "message": "Error message",
    "userMessage": "User-friendly message"
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error
