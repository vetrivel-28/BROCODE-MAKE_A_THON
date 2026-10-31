import { Router } from "express";
import { InsightsController } from "./insights.controller.js";

export const insightsRouter = Router();

// Revenue Intelligence aggregates (< 2s response with 60s cache)
insightsRouter.get("/revenue-summary", InsightsController.getRevenueSummary);

// Customer Health Score Board
insightsRouter.get("/customer-health", InsightsController.getCustomerHealth);

// Customization Studio Catalog & Pricing
insightsRouter.get("/customizations", InsightsController.getCustomizations);
insightsRouter.post("/customizations/purchase", InsightsController.purchaseCustomization);

// Ask Your Revenue AI Query Assistant
insightsRouter.post("/ask-revenue", InsightsController.askRevenue);
