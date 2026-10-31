import { Request, Response } from 'express';
import { invoiceService } from './invoice.service.js';
import {
  generateInvoiceSchema,
  manualCreateInvoiceSchema,
  patchInvoiceSchema,
  queryInvoicesSchema,
  sendInvoiceSchema,
} from './invoice.schema.js';

export class InvoiceController {
  public async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedQuery = queryInvoicesSchema.parse(req.query);
      const result = await invoiceService.getInvoices(tenantId, parsedQuery);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invoice query parameters',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch invoices',
        },
      });
    }
  }

  public async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const invoice = await invoiceService.getInvoiceById(tenantId, id);
      if (!invoice) {
        res.status(404).json({
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: `Invoice with id ${id} not found`,
          },
        });
        return;
      }
      res.status(200).json(invoice);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch invoice',
        },
      });
    }
  }

  public async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedBody = generateInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.generateInvoice(tenantId, parsedBody);
      res.status(201).json(invoice);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invoice generation payload',
            details: err.issues,
          },
        });
        return;
      }
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to generate invoice',
        },
      });
    }
  }

  public async createManualInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedBody = manualCreateInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.createManualInvoice(tenantId, parsedBody);
      res.status(201).json(invoice);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid manual invoice payload',
            details: err.issues,
          },
        });
        return;
      }
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to create manual invoice',
        },
      });
    }
  }

  public async confirmInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const invoice = await invoiceService.confirmInvoice(tenantId, id);
      res.status(200).json(invoice);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to confirm invoice',
        },
      });
    }
  }

  public async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const invoice = await invoiceService.cancelInvoice(tenantId, id);
      res.status(200).json(invoice);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to cancel invoice',
        },
      });
    }
  }

  public async patchInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const parsedBody = patchInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.patchInvoice(tenantId, id, parsedBody);
      res.status(200).json(invoice);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid patch payload',
            details: err.issues,
          },
        });
        return;
      }
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to patch invoice',
        },
      });
    }
  }

  public async getInvoicePdf(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const invoice = await invoiceService.getInvoiceById(tenantId, id);
      if (!invoice) {
        res.status(404).json({
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: `Invoice ${id} not found`,
          },
        });
        return;
      }

      const pdfBuffer = await invoiceService.generateInvoicePdf(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to generate PDF',
        },
      });
    }
  }

  public async sendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const parsedBody = sendInvoiceSchema.parse(req.body);
      const result = await invoiceService.sendInvoice(
        tenantId,
        id,
        parsedBody.recipientEmail,
        parsedBody.customMessage
      );
      res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid send invoice payload',
            details: err.issues,
          },
        });
        return;
      }
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to send invoice',
        },
      });
    }
  }
}

export const invoiceController = new InvoiceController();
