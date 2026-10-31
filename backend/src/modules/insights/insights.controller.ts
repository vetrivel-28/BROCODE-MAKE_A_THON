import { Request, Response } from "express";
import {
  revenueSummaryQuerySchema,
  customerHealthQuerySchema,
  purchaseCustomizationSchema,
  askRevenueQuerySchema,
} from "./insights.schema.js";
import { InsightsService } from "./insights.service.js";

export class InsightsController {
  // GET /api/insights/revenue-summary
  static async getRevenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = revenueSummaryQuerySchema.parse(req.query);
      const data = await InsightsService.getRevenueSummary(validatedQuery);
      res.status(200).json({ status: "success", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load revenue summary";
      res.status(400).json({ status: "error", message });
    }
  }

  // GET /api/insights/customer-health
  static async getCustomerHealth(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = customerHealthQuerySchema.parse(req.query);
      const data = await InsightsService.getCustomerHealth(validatedQuery);
      res.status(200).json({ status: "success", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch customer health";
      res.status(400).json({ status: "error", message });
    }
  }

  // GET /api/insights/customizations
  static async getCustomizations(_req: Request, res: Response): Promise<void> {
    try {
      const data = await InsightsService.getCustomizationStudioCatalog();
      res.status(200).json({ status: "success", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch customization catalog";
      res.status(400).json({ status: "error", message });
    }
  }

  // POST /api/insights/customizations/purchase
  static async purchaseCustomization(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = purchaseCustomizationSchema.parse(req.body);
      const data = await InsightsService.purchaseCustomization(validatedBody);
      res.status(200).json({ status: "success", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process customization purchase";
      res.status(400).json({ status: "error", message });
    }
  }

  // POST /api/insights/ask-revenue
  static async askRevenue(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = askRevenueQuerySchema.parse(req.body);
      const data = await InsightsService.askRevenueAssistant(validatedBody);
      res.status(200).json({ status: "success", data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process revenue AI query";
      res.status(400).json({ status: "error", message });
    }
  }
}
