import { Router, Request, Response } from 'express';
import { BillingService } from './billing.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createBillingRouter(
  service: BillingService = new BillingService(),
  subscriptionsService: SubscriptionsService = new SubscriptionsService()
): Router {
  const router = Router();

  // Invoices list & detail
  router.get('/invoices', authorize(), (req: Request, res: Response) => {
    const list = service.listInvoices(req.user!.tenantId);
    res.json({ invoices: list });
  });

  router.get('/invoices/:id', authorize(), (req: Request, res: Response) => {
    const inv = service.getInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  router.post('/invoices/:id/confirm', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const inv = service.confirmInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  router.post('/invoices/:id/cancel', authorize('ADMIN'), (req: Request, res: Response) => {
    const inv = service.cancelInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  // Record payment against invoice
  router.post('/invoices/:id/payments', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const amountPaise = Math.round(Number(req.body.amountInr) * 100);
    const result = service.recordPayment(req.params.id, amountPaise, req.body.method, req.body.note);
    res.json(result);
  });

  // Billing Day Control Room (Unique Feature #3)
  router.get('/control-room', authorize(), (req: Request, res: Response) => {
    const history = service.getBillingRunHistory(req.user!.tenantId);
    res.json({ runs: history });
  });

  router.post('/control-room/run', authorize('ADMIN'), (req: Request, res: Response) => {
    const subs = subscriptionsService.listSubscriptions(req.user!.tenantId);
    const result = service.runBillingEngine(req.user!.tenantId, subs);
    res.json(result);
  });

  // Autopilot Dunning & Overdue Board (Unique Feature #5)
  router.get('/overdue', authorize(), (req: Request, res: Response) => {
    const overdueBoard = service.getOverdueBoard(req.user!.tenantId);
    res.json(overdueBoard);
  });

  // Summary endpoint for P4 Dashboard
  router.get('/summary', authorize(), (req: Request, res: Response) => {
    const summary = service.getBillingSummary(req.user!.tenantId);
    res.json(summary);
  });

  return router;
}

export default createBillingRouter;
