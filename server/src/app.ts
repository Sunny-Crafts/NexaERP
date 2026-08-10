import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middlewares
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
