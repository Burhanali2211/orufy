# Sufi Essences Backend Server

Express.js backend server for the Sufi Essences e-commerce platform, replacing Supabase with self-hosted PostgreSQL.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sufi_essences
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here
```

### 3. Database Setup

First, create the PostgreSQL database:

```bash
createdb sufi_essences
```

The server will automatically initialize the schema and seed sample data on first run.
Alternatively, you can manually initialize:

```bash
npm run db:init
```

### 4. Start Development Server

```bash
npm run dev:server
```

Or run both frontend and backend:

```bash
npm run dev:all
```

## Project Structure

```
server/
├── db/
│   ├── connection.ts      # Database connection pool
│   ├── init.ts            # Schema initialization
│   └── schema.sql         # Database schema
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Error handling
│   └── requestLogger.ts   # Request logging
├── routes/                # API routes (Phase 2)
├── services/              # Business logic (Phase 2)
├── utils/
│   └── auth.ts            # Auth utilities
├── scripts/
│   ├── autoInitDb.ts      # Auto database initialization (NEW)
│   └── initDb.ts          # Manual database initialization
├── index.ts               # Server entry point
└── tsconfig.json          # TypeScript config
```

## Auto-Initialization Feature

The server now includes an auto-initialization feature that automatically:
1. Creates database schema if it doesn't exist
2. Seeds sample categories, products, and users
3. Ensures consistent setup across different environments

This makes it easy to set up the project on new machines without manual database setup.

Default sample users:
- Admin: admin@example.com / admin123
- Seller: seller@example.com / admin123
- Customer: customer@example.com / admin123

## API Endpoints (Phase 2)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List products (paginated)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove from cart

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status (admin)

## Database Schema

### Core Tables
- `profiles` - User accounts and profiles
- `categories` - Product categories
- `products` - Product catalog
- `product_variants` - Product variations
- `cart_items` - Shopping cart
- `wishlist_items` - Wishlist
- `orders` - Order management
- `order_items` - Order line items
- `reviews` - Product reviews
- `addresses` - User addresses

## Authentication

Uses JWT tokens with bcrypt password hashing:

1. User registers with email and password
2. Password is hashed with bcrypt
3. User logs in with email and password
4. Server returns JWT token
5. Client includes token in Authorization header for protected routes

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/products"
  }
}
```

## Performance Features

- Connection pooling (max 20 connections)
- Query logging with execution time
- Indexed database queries
- Pagination support
- Request logging

## Security Features

- JWT authentication
- Bcrypt password hashing
- CORS configuration
- Helmet security headers
- Parameterized queries (SQL injection prevention)
- Role-based access control

## Development

### Type Checking
```bash
tsc --noEmit
```

### Build
```bash
npm run build:server
```

### Lint
```bash
npm run lint
```

## Next Steps

1. ✅ Phase 1: Backend Setup (COMPLETE)
2. ⏳ Phase 2: API Layer - Create REST endpoints
3. ⏳ Phase 3: Frontend Integration - Replace Supabase calls
4. ⏳ Phase 4: Testing & Optimization

## Support

For issues or questions, refer to the main project documentation in `/docs`.