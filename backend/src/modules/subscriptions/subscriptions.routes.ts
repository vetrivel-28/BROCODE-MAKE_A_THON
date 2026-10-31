import { Router, Request, Response } from 'express';
import { SubscriptionsService, SubscriptionStatus } from './subscriptions.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createSubscriptionsRouter(service: SubscriptionsService = new SubscriptionsService()): Router {
  const router = Router();

  // Subscriptions CRUD
  router.get('/', authorize(), (req: Request, res: Response) => {
    const list = service.listSubscriptions(req.user!.tenantId);
    res.json({ subscriptions: list });
  });

  router.post('/', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const created = service.createSubscription(req.user!.tenantId, req.body);
    res.status(201).json(created);
  });

  router.get('/:id', authorize(), (req: Request, res: Response) => {
    const sub = service.getSubscription(req.params.id, req.user!.tenantId);
    res.json(sub);
  });

  router.post('/:id/status', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const { status } = req.body;
    const updated = service.updateStatus(req.params.id, status as SubscriptionStatus, req.user!.tenantId);
    res.json(updated);
  });

  // Smart Discount Engine
  router.get('/discounts/list', authorize(), (req: Request, res: Response) => {
    const list = service.listDiscounts(req.user!.tenantId);
    res.json({ discounts: list });
  });

  router.post('/discounts', authorize('ADMIN'), (req: Request, res: Response) => {
    const created = service.createDiscount(req.user!.tenantId, req.body);
    res.status(201).json(created);
  });

  router.get('/discounts/seat-suggestion', authorize(), (req: Request, res: Response) => {
    const seats = Number(req.query.seats) || 1;
    const suggestion = service.getSeatSuggestion(seats);
    res.json({ suggestion });
  });

  return router;
}

export default createSubscriptionsRouter;
