import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createIdentityRouter } from './modules/identity/identity.routes.js';
import { IdentityService } from './modules/identity/identity.service.js';
import { authorize } from './common/auth.middleware.js';

dotenv.config();

export function createApp(identityService?: IdentityService) {
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

  // Identity Module routes
  const idService = identityService || new IdentityService();
  const identityRouter = createIdentityRouter(idService);

  app.use('/api/identity', identityRouter);
  app.use('/identity', identityRouter);

  // Section 12 contract: GET /passport
  app.get('/passport', authorize(), (req: Request, res: Response) => {
    idService
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

