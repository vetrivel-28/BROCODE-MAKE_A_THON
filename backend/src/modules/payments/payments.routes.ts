import { Router, Request, Response } from 'express';
import { PaymentsService, CUSTOMIZATION_CATALOG } from './payments.service.js';
import { IdentityService } from '../identity/identity.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createPaymentsRouter(
  service: PaymentsService = new PaymentsService(),
  identityService: IdentityService = new IdentityService()
): Router {
  const router = Router();

  // Customization Wallet
  router.get('/wallet', authorize(), (req: Request, res: Response) => {
    const data = service.getWallet(req.user!.tenantId);
    res.json(data);
  });

  router.post('/wallet/topup', authorize('ADMIN'), (req: Request, res: Response) => {
    const amountInr = Number(req.body.amountInr) || 1000;
    const result = service.topUpWallet(req.user!.tenantId, amountInr, req.body.razorpayPaymentId);
    res.json(result);
  });

  // Customization Catalog & Purchases (Unique Feature #2)
  router.get('/customizations/catalog', authorize(), (_req: Request, res: Response) => {
    res.json({ catalog: CUSTOMIZATION_CATALOG });
  });

  router.post('/customizations/purchase', authorize('ADMIN'), async (req: Request, res: Response) => {
    const remainingSlots = await identityService.remainingCustomizationSlots(req.user!.tenantId);
    const result = service.purchaseCustomization(req.user!.tenantId, req.body.itemCode, remainingSlots);
    res.json(result);
  });

  router.post('/customizations/bundle', authorize('ADMIN'), async (req: Request, res: Response) => {
    const remainingSlots = await identityService.remainingCustomizationSlots(req.user!.tenantId);
    const result = service.purchaseBundle(req.user!.tenantId, req.body.itemCodes, remainingSlots);
    res.json(result);
  });

  router.get('/customizations/history', authorize(), (req: Request, res: Response) => {
    const history = service.listPurchases(req.user!.tenantId);
    res.json({ purchases: history });
  });

  return router;
}

export default createPaymentsRouter;
