# Setup Guide

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

Create `.env` file:
```
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key-min-32-chars
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5001
VITE_RAZORPAY_KEY_ID=your-razorpay-key
VITE_GA_MEASUREMENT_ID=G-your-id
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

The database schema is automatically initialized on first run.

### 4. Start Development Server

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## Production Build

```bash
npm run build
```

This creates:
- `dist/` - Frontend build
- `server/dist/` - Backend build

## Database

Uses Supabase PostgreSQL. All queries go through the connection pool.

Connection pooling is configured in `server/db/connection.ts`.

## API

Express server runs on port 5001 in development.

On Vercel, API routes are handled by `/api/index.ts`.

## Frontend

React + Vite frontend served from `dist/` directory.

API calls use `VITE_API_URL` environment variable.

## Testing

```bash
# Test API
curl http://localhost:5001/api/health

# Test frontend
curl http://localhost:5173
```
