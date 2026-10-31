import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createIdentityRouter } from './modules/identity/identity.routes.js';
import { IdentityService } from './modules/identity/identity.service.js';
import { createCatalogRouter } from './modules/catalog/catalog.routes.js';
import { CatalogService } from './modules/catalog/catalog.service.js';
import { createSubscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';
import { SubscriptionsService } from './modules/subscriptions/subscriptions.service.js';
import { createBillingRouter } from './modules/billing/billing.routes.js';
import { BillingService } from './modules/billing/billing.service.js';
import { createPaymentsRouter } from './modules/payments/payments.routes.js';
import { PaymentsService } from './modules/payments/payments.service.js';
import { createInsightsRouter } from './modules/insights/insights.routes.js';
import { InsightsService } from './modules/insights/insights.service.js';
import { authorize } from './common/auth.middleware.js';

dotenv.config();

export function createApp(idService?: IdentityService) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Attach test date header middleware
  app.use((req: Request, _res: Response, next) => {
    const testDate = req.headers['x-test-date'];
    if (typeof testDate === 'string') {
      req.testDateHeader = testDate;
    }
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Services
  const identityService = idService || new IdentityService();
  const catalogService = new CatalogService();
  const subscriptionsService = new SubscriptionsService();
  const billingService = new BillingService();
  const paymentsService = new PaymentsService();
  const insightsService = new InsightsService();

  // Routers
  const identityRouter = createIdentityRouter(identityService);
  const catalogRouter = createCatalogRouter(catalogService);
  const subscriptionsRouter = createSubscriptionsRouter(subscriptionsService);
  const billingRouter = createBillingRouter(billingService, subscriptionsService);
  const paymentsRouter = createPaymentsRouter(paymentsService, identityService);
  const insightsRouter = createInsightsRouter(insightsService, billingService, subscriptionsService);

  // Mount at /api directly (for Person 1, 2, 3, and 4 frontends)
  app.use('/api', identityRouter);
  app.use('/api/auth', identityRouter);
  app.use('/auth', identityRouter);
  app.use('/api', billingRouter);
  app.use('/api', paymentsRouter);
  app.use('/api', catalogRouter);
  app.use('/api', subscriptionsRouter);
  app.use('/api', insightsRouter);

  // Mount at module-specific prefixes
  app.use('/api/identity', identityRouter);
  app.use('/identity', identityRouter);

  app.use('/api/catalog', catalogRouter);
  app.use('/catalog', catalogRouter);

  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/subscriptions', subscriptionsRouter);

  app.use('/api/billing', billingRouter);
  app.use('/billing', billingRouter);

  app.use('/api/payments', paymentsRouter);
  app.use('/payments', paymentsRouter);

  app.use('/api/insights', insightsRouter);
  app.use('/insights', insightsRouter);

  // Section 12 contract: GET /passport
  app.get('/passport', authorize(), (req: Request, res: Response) => {
    identityService
      .getPrivilegePassport(req.user!.tenantId)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } }));
  });

  // Root welcome
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'LoopDesk API',
      version: '1.0.0',
      description: 'B2B Subscription Management SaaS'
    });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test' && (!process.env.VITEST || process.env.VITEST !== 'true')) {
  const port = process.env.PORT || 4000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`LoopDesk Backend running on http://localhost:${port}`);
  });
}
