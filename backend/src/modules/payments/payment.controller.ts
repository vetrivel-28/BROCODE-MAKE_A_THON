import { Request, Response } from 'express';
import { paymentService } from './payment.service.js';
import { recordPaymentSchema, queryPaymentsSchema } from './payment.schema.js';

export class PaymentController {
  public async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const invoiceId = req.params.id as string;
      const parsedBody = recordPaymentSchema.parse(req.body);
      const result = await paymentService.recordPayment(tenantId, invoiceId, parsedBody);
      res.status(201).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment payload',
            details: err.issues,
          },
        });
        return;
      }
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to record payment',
        },
      });
    }
  }

  public async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedQuery = queryPaymentsSchema.parse(req.query);
      const result = await paymentService.getPayments(tenantId, parsedQuery);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment query parameters',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch payments',
        },
      });
    }
  }

  public async getPaymentsByInvoiceId(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const invoiceId = req.params.id as string;
      const payments = await paymentService.getPaymentsByInvoiceId(tenantId, invoiceId);
      res.status(200).json({ data: payments });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch invoice payments',
        },
      });
    }
  }
}

export const paymentController = new PaymentController();

