import { Request, Response } from 'express';
import { taxService } from './tax.service.js';
import { createTaxSchema, updateTaxSchema, queryTaxSchema } from './tax.schema.js';

export class TaxController {
  public async getTaxes(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedQuery = queryTaxSchema.parse(req.query);
      const result = await taxService.getTaxes(tenantId, parsedQuery);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tax query parameters',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch taxes',
        },
      });
    }
  }

  public async getTaxById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const tax = await taxService.getTaxById(tenantId, id);
      if (!tax) {
        res.status(404).json({
          error: {
            code: 'TAX_NOT_FOUND',
            message: `Tax with id ${id} not found`,
          },
        });
        return;
      }
      res.status(200).json(tax);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch tax',
        },
      });
    }
  }

  public async createTax(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const parsedBody = createTaxSchema.parse(req.body);
      const created = await taxService.createTax(tenantId, parsedBody);
      res.status(201).json(created);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tax payload',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to create tax',
        },
      });
    }
  }

  public async updateTax(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'tenant_default';
      const id = req.params.id as string;
      const parsedBody = updateTaxSchema.parse(req.body);
      const updated = await taxService.updateTax(tenantId, id, parsedBody);
      if (!updated) {
        res.status(404).json({
          error: {
            code: 'TAX_NOT_FOUND',
            message: `Tax with id ${id} not found`,
          },
        });
        return;
      }
      res.status(200).json(updated);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tax payload',
            details: err.issues,
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to update tax',
        },
      });
    }
  }
}

export const taxController = new TaxController();

