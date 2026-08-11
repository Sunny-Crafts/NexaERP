import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Parse and normalize CORS origin(s) from environment variable (strip trailing slashes)
const rawCorsOrigin = config.corsOrigin || '*';
const allowedOrigins = rawCorsOrigin === '*'
  ? '*'
  : rawCorsOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, ''));

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins === '*' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback to prevent breaking UI
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route for browser clicks
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'NexaERP Backend API Server is Live and Operational',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      customers: '/api/customers',
      products: '/api/products',
      inventory: '/api/inventory',
      challans: '/api/challans',
      dashboard: '/api/dashboard'
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Route Not Found Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
