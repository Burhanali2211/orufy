# E-Commerce Platform - Project Overview

## What is this project?

This is **Himalayan Spices Exports** - a modern e-commerce platform built for selling spices online.

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js  
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Payments**: Razorpay integration
- **Deployment**: Vercel & Netlify support
- **Monitoring**: Sentry for error tracking

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
- Frontend runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:5001`

### Build for Production
```bash
npm run build
npm run preview
```

## Project Structure

```
ecommerce/
├── src/                    # React frontend source code
├── public/                 # Static assets
├── db/                     # Database schema and migrations
├── supabase/              # Supabase configuration
├── scripts/               # Utility scripts
├── docs/                  # Documentation
│   └── archive/          # All archived documentation
├── package.json           # Project dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── README.md              # Project README
└── docker-compose.yml     # Docker setup
```

## Environment Setup

Create a `.env` file in the project root with:
```
DATABASE_URL=your_postgresql_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:5001
VITE_GA_MEASUREMENT_ID=your_google_analytics_id
```

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Check TypeScript types |
| `npm run preview` | Preview production build |

## Documentation

All detailed documentation has been archived in `docs/archive/` for reference. Key sections include:

- **Deployment Guides**: Netlify and Vercel setup
- **API Documentation**: Full API reference
- **Database Guides**: Schema and migration documentation
- **Integration Guides**: Razorpay, Google Analytics, Supabase
- **Fixing Guides**: Solutions for common issues

## Deployment

### Vercel (Recommended)
- Push to GitHub/GitLab
- Connect to Vercel
- Automatic deployments on push

### Netlify
- Documentation in `docs/archive/NETLIFY_DEPLOYMENT_GUIDE.md`

### Docker
```bash
docker-compose up
```

## Key Features

✅ User authentication with JWT
✅ Product catalog with search and filtering
✅ Shopping cart and checkout
✅ Payment integration with Razorpay
✅ Admin dashboard
✅ Order management
✅ Database-backed with Supabase
✅ Image optimization
✅ SEO optimization
✅ Error tracking with Sentry
✅ Analytics with Google Analytics

## Development Workflow

1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Edit files in `src/`
3. **Run lint**: `npm run lint:fix`
4. **Test**: Browse to `http://localhost:5173`
5. **Commit**: `git add . && git commit -m "Your message"`
6. **Push**: `git push origin feature/your-feature`

## Troubleshooting

### Dependencies not installed
```bash
npm install
# or
npm ci  # for exact versions
```

### Port already in use
Change the port in `vite.config.ts` or kill the process using the port.

### Database connection issues
- Verify `.env` has correct `DATABASE_URL`
- Check Supabase dashboard for connection status
- Ensure IP is whitelisted in Supabase

## Support

For issues or questions:
1. Check existing documentation in `docs/archive/`
2. Review error logs in the console
3. Check Sentry dashboard for deployed errors

---

*Last updated: March 19, 2026*
