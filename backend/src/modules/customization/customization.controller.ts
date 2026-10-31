import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { customizationService } from "./customization.service.js";
import { createCustomizationSchema } from "./customization.validation.js";

export const customizationController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const customizations = await customizationService.list(principal.tenantId);
    return { customizations };
  }),

  getById: controller(async (request) => {
    const principal = requireTenant(request);
    const customization = await customizationService.getById(
      principal.tenantId,
      getParamId(request),
    );
    return { customization };
  }),

  request: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createCustomizationSchema.parse(request.body);
      const customization = await customizationService.request(principal.tenantId, input);
      return { customization };
    },
    201,
  ),
};
