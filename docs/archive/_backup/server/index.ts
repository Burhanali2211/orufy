import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiLimiter, adminLimiter } from './middleware/rateLimiter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import addressRoutes from './routes/addresses';
import orderRoutes from './routes/orders';
import paymentMethodRoutes from './routes/paymentMethods';
import notificationPreferenceRoutes from './routes/notificationPreferences';
import shippingRoutes from './routes/shipping';
import sitemapRoutes from './routes/sitemap';
import razorpayRoutes from './routes/razorpay';
import uploadRoutes from './routes/upload';
import contactRoutes from './routes/contact';

// Admin routes
import adminAnalyticsRoutes from './routes/admin/analytics';
import adminProductsRoutes from './routes/admin/products';
import adminUsersRoutes from './routes/admin/users';
import adminOrdersRoutes from './routes/admin/orders';
import adminSettingsRoutes from './routes/admin/settings';
import adminContactSubmissionsRoutes from './routes/admin/contactSubmissions';
import adminInventoryRoutes from './routes/admin/inventory';
import adminPosRoutes from './routes/admin/pos';

// Public routes
import publicSettingsRoutes from './routes/public/settings';

// Seller routes
import sellerProductsRoutes from './routes/seller/products';
import sellerOrdersRoutes from './routes/seller/orders';

const app: Express = express();
const PORT = Number(process.env.PORT) || 5001;

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'https://www.himalayanspicesexports.com',
      'https://himalayanspicesexports.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5001'
    ];
    if (process.env.NODE_ENV === 'development' || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware
app.use(requestLogger);

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Routes
app.use('/', sitemapRoutes);
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/notification-preferences', notificationPreferenceRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

// Admin routes
if (process.env.NODE_ENV === 'production') {
  app.use('/api/admin', adminLimiter);
}
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/contact-submissions', adminContactSubmissionsRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);
app.use('/api/admin/pos', adminPosRoutes);

// Public routes
app.use('/api/public/settings', publicSettingsRoutes);

// Seller routes
app.use('/api/seller/products', sellerProductsRoutes);
app.use('/api/seller/orders', sellerOrdersRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      status: 404,
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      userMessage: 'The requested endpoint does not exist.',
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
