import { Router } from 'express';
import { invoiceController } from './invoice.controller.js';
import { authorize } from './contracts.js';

export const invoiceRoutes = Router();

// Invoices list & retrieval (STAFF, ADMIN, and SUPER_ADMIN read-only)
invoiceRoutes.get('/invoices', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  invoiceController.getInvoices(req, res);
});

invoiceRoutes.get('/invoices/:id', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  invoiceController.getInvoiceById(req, res);
});

invoiceRoutes.get('/invoices/:id/pdf', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  invoiceController.getInvoicePdf(req, res);
});

// Operations requiring write access (ADMIN and STAFF)
invoiceRoutes.post('/invoices/generate', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.generateInvoice(req, res);
});

invoiceRoutes.post('/invoices', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.createManualInvoice(req, res);
});

invoiceRoutes.post('/invoices/:id/confirm', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.confirmInvoice(req, res);
});

invoiceRoutes.post('/invoices/:id/cancel', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.cancelInvoice(req, res);
});

invoiceRoutes.patch('/invoices/:id', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.patchInvoice(req, res);
});

invoiceRoutes.post('/invoices/:id/send', authorize('ADMIN', 'STAFF'), (req, res) => {
  invoiceController.sendInvoice(req, res);
});
