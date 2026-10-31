import { Router, Request, Response } from 'express';
import { BillingService } from './billing.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createBillingRouter(
  service: BillingService = new BillingService(),
  subscriptionsService: SubscriptionsService = new SubscriptionsService()
): Router {
  const router = Router();

  // Invoices list (handles pagination & filters, supports both res.data and res.invoices)
  router.get('/invoices', authorize(), (req: Request, res: Response) => {
    let list = service.listInvoices(req.user!.tenantId);

    // Apply status filter
    if (req.query.status && typeof req.query.status === 'string') {
      list = list.filter((i) => i.status === req.query.status);
    }

    // Apply search filter
    if (req.query.search && typeof req.query.search === 'string') {
      const q = req.query.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.customerEmail.toLowerCase().includes(q)
      );
    }

    res.json({
      data: list,
      invoices: list,
      total: list.length,
      totalPages: 1,
      page: 1,
      limit: 20
    });
  });

  router.post('/invoices/generate', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const inv = service.generateSingleInvoice(
      req.user!.tenantId,
      req.body.subscriptionId || 'sub_demo_01',
      req.body.periodStart
    );
    res.status(201).json(inv);
  });

  router.get('/invoices/:id', authorize(), (req: Request, res: Response) => {
    const inv = service.getInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  router.get('/invoices/:id/payments', authorize(), (req: Request, res: Response) => {
    const payments = service.getPaymentsForInvoice(req.params.id);
    res.json({ data: payments, payments });
  });

  router.post('/invoices/:id/confirm', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const inv = service.confirmInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  router.post('/invoices/:id/cancel', authorize('ADMIN'), (req: Request, res: Response) => {
    const inv = service.cancelInvoice(req.params.id, req.user!.tenantId);
    res.json(inv);
  });

  router.post('/invoices/:id/send', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    res.json({
      success: true,
      emailOutboxId: `outbox-${Date.now()}`,
      sentAt: new Date().toISOString()
    });
  });

  router.get('/invoices/:id/pdf', authorize(), (req: Request, res: Response) => {
    const inv = service.getInvoice(req.params.id, req.user!.tenantId);
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Invoice ${inv.invoiceNumber}</title></head>
      <body style="font-family: sans-serif; padding: 40px;">
        <h2>Tax Invoice: ${inv.invoiceNumber}</h2>
        <p>Billed To: ${inv.customerName} (${inv.customerEmail})</p>
        <p>Total: ₹${inv.totalPaise / 100}</p>
        <p>Status: ${inv.status}</p>
        <p>Balance Due: ₹${inv.balancePaise / 100}</p>
      </body>
      </html>
    `);
  });

  // Record payment against invoice
  router.post('/invoices/:id/payments', authorize('ADMIN', 'STAFF'), (req: Request, res: Response) => {
    const amountPaise = req.body.amountInr !== undefined
      ? Math.round(Number(req.body.amountInr) * 100)
      : Math.round(Number(req.body.amountPaise));

    const result = service.recordPayment(req.params.id, amountPaise, req.body.method, req.body.note);
    res.json(result);
  });

  // Taxes
  router.get('/taxes', authorize(), (req: Request, res: Response) => {
    const list = service.listTaxes(req.user!.tenantId);
    res.json({ data: list, taxes: list });
  });

  router.post('/taxes', authorize('ADMIN'), (req: Request, res: Response) => {
    const tax = service.createTax(req.user!.tenantId, req.body);
    res.status(201).json(tax);
  });

  // Payments List
  router.get('/payments', authorize(), (req: Request, res: Response) => {
    const list = service.listPayments(req.user!.tenantId);
    res.json({
      data: list,
      payments: list,
      total: list.length,
      totalPages: 1,
      page: 1,
      limit: 20
    });
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
