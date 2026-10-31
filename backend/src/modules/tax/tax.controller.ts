import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { taxService } from "./tax.service.js";
import { createTaxSchema, updateTaxSchema } from "./tax.validation.js";

export const taxController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const taxes = await taxService.list(principal.tenantId);
    return { taxes };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createTaxSchema.parse(request.body);
      const tax = await taxService.create(principal.tenantId, input);
      return { tax };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateTaxSchema.parse(request.body);
    const tax = await taxService.update(principal.tenantId, getParamId(request), input);
    return { tax };
  }),

  toggle: controller(async (request) => {
    const principal = requireTenant(request);
    const tax = await taxService.toggle(principal.tenantId, getParamId(request));
    return { tax };
  }),
};
