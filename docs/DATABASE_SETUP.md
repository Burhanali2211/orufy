# Database Setup Guide

## Quick Start - One Command Setup

To set up the complete database with all tables, admin user, and sample data on **any machine**, run:

```bash
npm run db:setup
```

This single command will:
- ✅ Create all database tables (profiles, products, categories, orders, etc.)
- ✅ Create admin user: `admin@perfumes.com` / `admin123`
- ✅ Seed 5 categories (Perfumes, Colognes, Fragrances, Attars, Essential Oils)
- ✅ Seed 3 sample products with images and details
- ✅ Create site settings with default configuration
- ✅ Set up all required database extensions

---

## Prerequisites

### 1. PostgreSQL Database

You need a PostgreSQL database. Choose one option:

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Start PostgreSQL service
# Windows: Start from Services
# Mac: brew services start postgresql
# Linux: sudo service postgresql start

# Create database
createdb perfumes_db
```

**Option B: Cloud PostgreSQL (Recommended)**
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Free tier available
- [Render](https://render.com) - Free tier available

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and set your database URL:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# For local PostgreSQL:
DATABASE_URL=postgresql://postgres:password@localhost:5432/perfumes_db

# For Neon (example):
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/perfumes?sslmode=require

# JWT Secret (required)
JWT_SECRET=your-super-secret-jwt-key-at-least-128-characters-long

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# Optional: Email service
SENDGRID_API_KEY=your-sendgrid-api-key

# Optional: Payment gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

---

## Complete Setup Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set DATABASE_URL
# Use your preferred text editor
```

### Step 3: Run Database Setup

```bash
npm run db:setup
```

**Expected Output:**
```
🚀 Starting Complete Database Setup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Connecting to database...
   ✓ Database connection successful

2️⃣  Creating database schema (all tables)...
   ✓ Schema created successfully

3️⃣  Creating site settings tables...
   ✓ Site settings tables created

4️⃣  Creating admin user...
   ✓ Admin user created
   📧 Email: admin@perfumes.com
   🔑 Password: admin123

5️⃣  Seeding categories...
   ✓ 5 categories seeded

6️⃣  Seeding sample products...
   ✓ 3 sample products seeded

7️⃣  Creating default site settings...
   ✓ Default site settings created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATABASE SETUP COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   ✓ All database tables created
   ✓ Admin user created
   ✓ 5 categories seeded
   ✓ 3 sample products seeded
   ✓ Site settings configured

🔐 Admin Credentials:
   📧 Email:    admin@perfumes.com
   🔑 Password: admin123
   🌐 Login at: http://localhost:5173/admin

⚠️  IMPORTANT:
   • Change admin password after first login
   • Update site settings in admin panel
   • Add more products as needed

🚀 Ready to start the application!
   Run: npm run dev:all
```

### Step 4: Start the Application

```bash
npm run dev:all
```

This will start both the frontend (port 5173) and backend (port 5000).

### Step 5: Login to Admin Panel

1. Open browser: `http://localhost:5173/admin`
2. Login with:
   - **Email:** `admin@perfumes.com`
   - **Password:** `admin123`
3. **IMPORTANT:** Change your password immediately!

---

## Database Tables Created

The setup script creates the following tables:

### Core Tables
- **profiles** - User accounts (admin, seller, customer)
- **categories** - Product categories
- **products** - Product catalog
- **orders** - Customer orders
- **order_items** - Order line items
- **cart_items** - Shopping cart
- **addresses** - User addresses
- **reviews** - Product reviews
- **wishlists** - User wishlists

### Additional Tables
- **site_settings** - Site configuration
- **social_media_accounts** - Social media links
- **contact_information** - Contact details
- **business_hours** - Operating hours
- **footer_links** - Footer navigation

---

## Sample Data Included

### Admin User
- **Email:** admin@perfumes.com
- **Password:** admin123
- **Role:** admin
- **Status:** Active, Email Verified

### Categories (5)
1. Perfumes
2. Colognes
3. Fragrances
4. Attars
5. Essential Oils

### Products (3)
1. **Royal Oud Attar** - $89.99 (was $129.99)
2. **Jasmine Night Perfume** - $64.99 (was $84.99)
3. **Amber Musk Essence** - $74.99 (was $99.99)

---

## Troubleshooting

### Error: "Connection refused"
```
✓ Check DATABASE_URL is correct in .env
✓ Ensure PostgreSQL is running
✓ Verify database credentials
```

### Error: "Database does not exist"
```bash
# Create the database first
createdb perfumes_db

# Or use your cloud provider's console
```

### Error: "Permission denied"
```
✓ Check database user has CREATE permissions
✓ Verify user can create tables and extensions
```

### Need to Reset Database?
```bash
# Drop all tables and re-run setup
npm run db:setup
```

---

## Additional Commands

```bash
# Complete setup (recommended)
npm run db:setup

# Initialize schema only
npm run db:init

# Seed categories only
npm run db:seed:categories

# Run site settings migration
npm run db:migrate:settings
```

---

## Moving to Another Computer

To set up the database on a new machine:

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd perfumes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

4. **Run setup**
   ```bash
   npm run db:setup
   ```

5. **Start application**
   ```bash
   npm run dev:all
   ```

That's it! The database will be fully set up with all tables, admin user, and sample data.

---

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. **Change default admin password** immediately after first login
2. **Never commit `.env` file** to version control
3. **Use strong passwords** in production
4. **Enable SSL/TLS** for database connections in production
5. **Rotate JWT_SECRET** regularly
6. **Delete or disable** sample users in production

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Verify your `.env` configuration
3. Ensure PostgreSQL is running
4. Check database connection logs

For more help, see:
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `API_DOCUMENTATION.md` - API reference
- `TESTING_STRATEGY.md` - Testing guide

