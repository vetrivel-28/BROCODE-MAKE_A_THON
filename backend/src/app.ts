import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { taxRoutes } from './modules/billing/tax.routes.js';
import { invoiceRoutes } from './modules/billing/invoice.routes.js';
import { paymentRoutes } from './modules/payments/payment.routes.js';

export const app: Express = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'loopdesk-billing-payments' });
});

// Mount module routes
app.use('/api', taxRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', paymentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(err.details ? { details: err.details } : {}),
    },
  });
});
