import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { discountService } from "./discount.service.js";
import {
  createDiscountSchema,
  updateDiscountSchema,
  validateDiscountSchema,
} from "./discount.validation.js";

export const discountController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const discounts = await discountService.list(principal.tenantId);
    return { discounts };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createDiscountSchema.parse(request.body);
      const discount = await discountService.create(principal.tenantId, input);
      return { discount };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateDiscountSchema.parse(request.body);
    const discount = await discountService.update(principal.tenantId, getParamId(request), input);
    return { discount };
  }),

  toggle: controller(async (request) => {
    const principal = requireTenant(request);
    const discount = await discountService.toggle(principal.tenantId, getParamId(request));
    return { discount };
  }),

  validate: controller(async (request) => {
    const principal = requireTenant(request);
    const input = validateDiscountSchema.parse(request.body);
    const result = await discountService.validate(principal.tenantId, input.code, input.amount);
    return {
      discount: result.discount,
      calculatedAmount: result.calculatedAmount,
    };
  }),
};
