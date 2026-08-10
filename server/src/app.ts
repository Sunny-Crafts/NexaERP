import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Parse CORS origin(s) from environment variable
const allowedOrigins = config.corsOrigin.includes(',')
  ? config.corsOrigin.split(',').map((origin) => origin.trim())
  : config.corsOrigin;

// Middlewares
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
