# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "data": {},
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": {
    "status": 400,
    "code": "ERROR_CODE",
    "message": "Error message",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/endpoint"
  }
}
```

## Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "customer"
  },
  "token": "jwt_token"
}
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "customer"
  },
  "token": "jwt_token"
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "customer",
    "phone": "+1234567890",
    "avatar": "url",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "phone": "+1234567890",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

## Product Endpoints

### List Products
```
GET /products?page=1&limit=20&categoryId=uuid&search=term&featured=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `categoryId` (optional): Filter by category
- `search` (optional): Search by name or description
- `featured` (optional): Show only featured products

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "images": ["url1", "url2"],
      "rating": 4.5,
      "reviewCount": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get Product Details
```
GET /products/:id
```

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "description": "...",
    "price": 99.99,
    "stock": 50,
    "variants": [
      {
        "id": "uuid",
        "name": "Size M",
        "price": 99.99,
        "stock": 20
      }
    ],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Great product",
        "comment": "...",
        "fullName": "John Doe"
      }
    ]
  }
}
```

### Create Product
```
POST /products
Authorization: Bearer <token>
```

**Required Role:** admin, seller

**Request Body:**
```json
{
  "name": "Product Name",
  "price": 99.99,
  "description": "...",
  "categoryId": "uuid",
  "images": ["url1", "url2"],
  "stock": 50,
  "sku": "SKU123"
}
```

### Update Product
```
PUT /products/:id
Authorization: Bearer <token>
```

**Required Role:** admin, seller (owner)

### Delete Product
```
DELETE /products/:id
Authorization: Bearer <token>
```

**Required Role:** admin, seller (owner)

## Category Endpoints

### List Categories
```
GET /categories
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Perfumes",
      "slug": "perfumes",
      "description": "...",
      "imageUrl": "url"
    }
  ]
}
```

### Get Category Details
```
GET /categories/:id
```

**Response:**
```json
{
  "category": {
    "id": "uuid",
    "name": "Perfumes",
    "slug": "perfumes"
  },
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 99.99
    }
  ]
}
```

### Create Category
```
POST /categories
Authorization: Bearer <token>
```

**Required Role:** admin

### Update Category
```
PUT /categories/:id
Authorization: Bearer <token>
```

**Required Role:** admin

### Delete Category
```
DELETE /categories/:id
Authorization: Bearer <token>
```

**Required Role:** admin

## Cart Endpoints

### Get Cart
```
GET /cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 2
    }
  ],
  "subtotal": 199.98,
  "itemCount": 1
}
```

### Add to Cart
```
POST /cart
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid (optional)",
  "quantity": 1
}
```

### Update Cart Item
```
PUT /cart/:itemId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 2
}
```

### Remove from Cart
```
DELETE /cart/:itemId
Authorization: Bearer <token>
```

### Clear Cart
```
DELETE /cart
Authorization: Bearer <token>
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| EMAIL_EXISTS | 409 | Email already registered |
| INSUFFICIENT_STOCK | 409 | Not enough stock |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production.

## Pagination

Use `page` and `limit` query parameters:
- Default limit: 20
- Maximum limit: 100
- Pages are 1-indexed

## Filtering

Products support filtering by:
- `categoryId`: Filter by category
- `search`: Search by name or description
- `featured`: Show only featured products

## Sorting

Products are sorted by creation date (newest first).

