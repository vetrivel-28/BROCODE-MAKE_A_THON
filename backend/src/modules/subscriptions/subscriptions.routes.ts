import { Router } from 'express';
import { subscriptionsControllers } from './subscriptions.controller.js';
import { SUBSCRIPTIONS_FEATURE, type SubscriptionRouteDependencies } from './subscriptions.types.js';

export function createSubscriptionsRouter(dependencies: SubscriptionRouteDependencies): Router {
  const router = Router();
  const controllers = subscriptionsControllers(dependencies);
  const featureGate = async (
    request: Parameters<ReturnType<typeof dependencies.requireRole>>[0],
    response: Parameters<ReturnType<typeof dependencies.requireRole>>[1],
    next: Parameters<ReturnType<typeof dependencies.requireRole>>[2],
  ) => {
    try {
      if (!await dependencies.can(dependencies.context(request).tenantId, SUBSCRIPTIONS_FEATURE)) {
        response.status(403).json({ error: 'Subscriptions are not available on this tier' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  router.post('/from-template', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), featureGate, controllers.createFromTemplate);
  router.get('/', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'), featureGate, controllers.list);
  router.get('/due', dependencies.requireRole('SUPER_ADMIN', 'ADMIN'), featureGate, controllers.due);
  router.get('/:subscriptionId', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'), featureGate, controllers.details);
  router.post('/:subscriptionId/transitions', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'), featureGate, controllers.transition);
  router.get('/:subscriptionId/timeline', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'), featureGate, controllers.timeline);
  router.get('/:subscriptionId/applicable-discounts', dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'), featureGate, controllers.applicableDiscounts);
  router.post('/discount-usage', dependencies.requireRole('SUPER_ADMIN', 'ADMIN'), featureGate, controllers.recordUsage);
  return router;
}
