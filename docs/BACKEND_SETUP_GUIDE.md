# Backend Setup Guide - Phase 1 Complete

## Overview

Phase 1 of the Supabase to PostgreSQL migration is now complete. The backend infrastructure is ready for API development.

## What Was Created

### 1. Express.js Server (`server/index.ts`)
- Main server entry point
- Middleware configuration (CORS, Helmet, JSON parsing)
- Health check endpoint
- Error handling setup

### 2. Database Layer (`server/db/`)
- **connection.ts**: PostgreSQL connection pooling with 20 max connections
- **schema.sql**: Complete database schema with all 10+ tables
- **init.ts**: Schema initialization and optional seeding

### 3. Middleware (`server/middleware/`)
- **auth.ts**: JWT authentication and role-based authorization
- **errorHandler.ts**: Global error handling with consistent error format
- **requestLogger.ts**: Request/response logging with timing

### 4. Authentication Utilities (`server/utils/auth.ts`)
- Password hashing with bcrypt
- JWT token generation and verification
- Token extraction from headers

### 5. Configuration
- `.env.example`: Updated with backend configuration
- `server/tsconfig.json`: TypeScript configuration for backend
- `package.json`: Updated with backend scripts

## Installation & Setup

### Step 1: Install Dependencies

Dependencies have already been installed:
- `express` - Web framework
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `cors` - CORS middleware
- `helmet` - Security headers
- `dotenv` - Environment variables
- `tsx` - TypeScript execution
- `concurrently` - Run multiple processes

### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sufi_essences
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your-super-secret-key-change-in-production
```

### Step 3: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sufi_essences;

# Exit
\q
```

### Step 4: Initialize Database Schema

```bash
npm run db:init
```

This will:
1. Connect to PostgreSQL
2. Create all tables
3. Create indexes
4. Seed sample data (optional)

## Running the Server

### Development Mode

```bash
# Run backend only
npm run dev:server

# Run frontend and backend together
npm run dev:all
```

The server will start on `http://localhost:5000`

### Production Build

```bash
npm run build:server
```

## Database Schema

The following tables have been created:

1. **profiles** - User accounts with roles (admin, seller, customer)
2. **categories** - Product categories with hierarchy
3. **products** - Product catalog with pricing and inventory
4. **product_variants** - Product variations (size, color, etc.)
5. **cart_items** - Shopping cart items
6. **wishlist_items** - Wishlist items
7. **orders** - Order management
8. **order_items** - Order line items
9. **reviews** - Product reviews and ratings
10. **addresses** - User shipping/billing addresses

All tables include:
- UUID primary keys
- Timestamps (created_at, updated_at)
- Proper indexes for performance
- Foreign key constraints

## API Endpoints (Ready for Phase 2)

The following endpoints will be implemented in Phase 2:

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Products
- `GET /api/products` (paginated)
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

### Categories
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` (admin)
- `PUT /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

### Cart
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`

### Orders
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PUT /api/orders/:id` (admin)

## Testing the Setup

### 1. Check Server Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Verify Database Connection

The server logs will show:
```
✓ Database connection initialized
✓ Server running on http://localhost:5000
```

### 3. Check Database Tables

```bash
psql -U postgres -d sufi_essences -c "\dt"
```

Should list all 10+ tables.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development, production |
| `PORT` | Server port | 5000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | sufi_essences |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | your_password |
| `DB_POOL_SIZE` | Connection pool size | 20 |
| `JWT_SECRET` | JWT signing key | your-secret-key |
| `JWT_EXPIRY` | Token expiry | 7d |

## Next Steps

### Phase 2: API Layer Development

1. Create authentication routes (`/api/auth`)
2. Create product routes (`/api/products`)
3. Create category routes (`/api/categories`)
4. Create cart routes (`/api/cart`)
5. Create order routes (`/api/orders`)
6. Create user routes (`/api/users`)

### Phase 3: Frontend Integration

1. Replace Supabase client with API calls
2. Implement pagination
3. Fix broken CRUD operations
4. Update data fetching

### Phase 4: Testing & Optimization

1. Test all endpoints
2. Performance testing
3. Security testing
4. Deployment

## Troubleshooting

### Database Connection Failed

1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Ensure database exists: `createdb sufi_essences`
4. Check connection: `psql -U postgres -d sufi_essences`

### Port Already in Use

Change `PORT` in `.env` or kill the process:
```bash
lsof -i :5000
kill -9 <PID>
```

### Schema Initialization Failed

1. Drop and recreate database:
```bash
dropdb sufi_essences
createdb sufi_essences
npm run db:init
```

2. Check PostgreSQL logs for errors

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` to a strong random value
2. Use environment-specific `.env` files
3. Enable HTTPS/SSL
4. Configure proper CORS origins
5. Implement rate limiting
6. Add request validation
7. Use connection pooling
8. Enable database backups

## Support

For issues or questions:
1. Check server logs: `npm run dev:server`
2. Review database schema: `server/db/schema.sql`
3. Check middleware: `server/middleware/`
4. Refer to main docs: `/docs`

