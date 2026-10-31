import { Router, Request, Response } from 'express';
import { InsightsService } from './insights.service.js';
import { BillingService } from '../billing/billing.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createInsightsRouter(
  insightsService: InsightsService = new InsightsService(),
  billingService: BillingService = new BillingService(),
  subscriptionsService: SubscriptionsService = new SubscriptionsService()
): Router {
  const router = Router();

  // Revenue Intelligence Dashboard Summary (Unique Feature #6)
  router.get('/dashboard', authorize(), (req: Request, res: Response) => {
    const summary = billingService.getBillingSummary(req.user!.tenantId);
    const activeSubs = subscriptionsService.listSubscriptions(req.user!.tenantId).filter((s) => s.status === 'ACTIVE').length;
    const data = insightsService.getDashboardMetrics(req.user!.tenantId, summary, activeSubs);
    res.json(data);
  });

  // Customer Health Score (Unique Feature #7)
  router.get('/health-scores', authorize(), (req: Request, res: Response) => {
    const scores = insightsService.getCustomerHealthScores(req.user!.tenantId);
    res.json({ healthScores: scores });
  });

  // Workspace Settings
  router.get('/settings', authorize(), (req: Request, res: Response) => {
    const settings = insightsService.getSettings(req.user!.tenantId);
    res.json({ settings });
  });

  router.post('/settings', authorize('ADMIN'), (req: Request, res: Response) => {
    const updated = insightsService.saveSettings(req.user!.tenantId, req.body);
    res.json({ settings: updated });
  });

  return router;
}

export default createInsightsRouter;

