import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import db, { seedAdmin } from './db/index.js';

import authRoutes from './modules/auth/routes.js';
import applicationsRoutes from './modules/applications/routes.js';
import adminRoutes from './modules/admin/routes.js';
import sellerProductsRoutes from './modules/seller/products.routes.js';
import sellerOrdersRoutes from './modules/seller/orders.routes.js';
import buyerProductsRoutes from './modules/buyer/products.routes.js';
import buyerOrdersRoutes from './modules/buyer/orders.routes.js';
import shipperRoutes from './modules/shipper/routes.js';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Seed admin
seedAdmin(env.ADMIN_EMAIL);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/applications', applicationsRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerProductsRoutes);
app.use('/seller', sellerOrdersRoutes);
app.use('/buyer', buyerProductsRoutes);
app.use('/buyer', buyerOrdersRoutes);
app.use('/shipper', shipperRoutes);

// Global error handler
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
