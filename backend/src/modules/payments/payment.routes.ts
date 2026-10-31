import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { authorize } from '../billing/contracts.js';

export const paymentRoutes = Router();

// Query all payments (STAFF, ADMIN, SUPER_ADMIN)
paymentRoutes.get('/payments', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  paymentController.getPayments(req, res);
});

// Query payments for a specific invoice
paymentRoutes.get('/invoices/:id/payments', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  paymentController.getPaymentsByInvoiceId(req, res);
});

// Record a payment against an invoice (ADMIN, STAFF)
paymentRoutes.post('/invoices/:id/payments', authorize('ADMIN', 'STAFF'), (req, res) => {
  paymentController.recordPayment(req, res);
});

