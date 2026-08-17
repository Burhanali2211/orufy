import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/db';
import { products, categories, stores } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import { authRouter } from './routes/auth';
import { platformRouter } from './routes/platform';
import { paymentRouter } from './routes/payment';
import { domainsRouter } from './routes/domains';
import { domainPurchasingRouter } from './routes/domainPurchasing';
import { merchantOrdersRouter } from './routes/merchantOrders';
import { customerOrdersRouter } from './routes/customerOrders';
import { customerRouter } from './routes/customer';
import { adminSettingsRouter } from './routes/adminSettings';
import { productsRouter } from './routes/products';
import { categoriesRouter } from './routes/categories';
import { healthRouter } from './routes/health';
import { requestLogger } from './middleware/requestLogger';
import { WorkerManager } from './workers/workerManager';
import { storeResolver, requireStore } from './middleware/storeResolver';
import { withStoreContext } from './db/utils';
import helmet from 'helmet';
import { authLimiter, checkoutLimiter, apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
app.set('trust proxy', ['loopback', '172.28.0.0/16']); // Explicitly trust Nginx running on Docker network

const port = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());
app.use(express.json({
  limit: '5mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(requestLogger);
app.use(storeResolver);

app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/platform', platformRouter);
app.use('/api/platform/payment', paymentRouter);
app.use('/api/platform/domains', domainsRouter);
app.use('/api/platform/domains/purchase', domainPurchasingRouter);
app.use('/api/merchant/orders', merchantOrdersRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/customer/orders', checkoutLimiter, customerOrdersRouter);
app.use('/api/customer', customerRouter);
app.use('/api', customerRouter);

// Mount products and categories routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);

// Dynamic Public Storefront Configuration Contract (Zero exposure of private merchant secrets)
app.get('/api/store/settings', requireStore, async (req, res) => {
  try {
    const store = res.locals.store;
    res.json({
      identity: {
        id: store.id,
        name: store.name,
        siteName: store.name,
        logo: '',
        favicon: '',
        announcementBar: 'Complimentary shipping on orders above ₹499',
      },
      branding: {
        primary: '#8c7e5a',
        accent: '#bfa760',
        typography: 'Inter',
      },
      commerce: {
        currency: 'INR',
        taxRatePct: store.tax_rate_percent ?? 18,
        shippingFeePaise: 0,
        freeShippingThresholdPaise: 49900,
        razorpayReady: Boolean(store.razorpay_linked_account_id),
      },
      contact: {
        email: `contact@${store.hostname}`,
        phone: '+91 98765 43210',
        address: 'Registered Business Address',
      },
      domain: {
        hostname: store.hostname,
        canonicalUrl: `https://${store.hostname}`,
      }
    });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
});

import { startReservationExpiryWorker } from './workers/reservationExpiryWorker';

const server = app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'test') {
    startReservationExpiryWorker(30000);
  }
});

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process terminating cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcefully terminating after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
