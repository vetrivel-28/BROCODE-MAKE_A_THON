import { Router, Request, Response } from 'express';
import { CatalogService } from './catalog.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createCatalogRouter(service: CatalogService = new CatalogService()): Router {
  const router = Router();

  // Products
  router.get('/products', authorize(), (req: Request, res: Response) => {
    const list = service.listProducts(req.user!.tenantId);
    res.json({ products: list });
  });

  router.post('/products', authorize('ADMIN'), (req: Request, res: Response) => {
    const created = service.createProduct(req.user!.tenantId, req.body);
    res.status(201).json(created);
  });

  // Plans
  router.get('/plans', authorize(), (req: Request, res: Response) => {
    const list = service.listPlans(req.user!.tenantId);
    res.json({ plans: list });
  });

  router.post('/plans', authorize('ADMIN'), (req: Request, res: Response) => {
    const created = service.createPlan(req.user!.tenantId, req.body);
    res.status(201).json(created);
  });

  // Quotation Templates
  router.get('/templates', authorize(), (req: Request, res: Response) => {
    const list = service.listTemplates(req.user!.tenantId);
    res.json({ templates: list });
  });

  router.post('/templates', authorize('ADMIN'), (req: Request, res: Response) => {
    const created = service.createTemplate(req.user!.tenantId, req.body);
    res.status(201).json(created);
  });

  return router;
}

export default createCatalogRouter;
