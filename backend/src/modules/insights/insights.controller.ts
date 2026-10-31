import { controller, requireTenant } from "../../shared/controller.js";
import { insightsService } from "./insights.service.js";

export const insightsController = {
  getInsights: controller(async (request) => {
    const principal = requireTenant(request);
    const insights = await insightsService.getInsights(principal.tenantId);
    return { insights };
  }),
};
