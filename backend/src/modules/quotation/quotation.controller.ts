import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { quotationService } from "./quotation.service.js";
import {
  createQuotationSchema,
  updateQuotationSchema,
} from "./quotation.validation.js";

export const quotationController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const quotations = await quotationService.list(principal.tenantId);
    return { quotations };
  }),

  getById: controller(async (request) => {
    const principal = requireTenant(request);
    const quotation = await quotationService.getById(principal.tenantId, getParamId(request));
    return { quotation };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createQuotationSchema.parse(request.body);
      const quotation = await quotationService.create(principal.tenantId, input);
      return { quotation };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateQuotationSchema.parse(request.body);
    const quotation = await quotationService.update(principal.tenantId, getParamId(request), input);
    return { quotation };
  }),

  confirm: controller(async (request) => {
    const principal = requireTenant(request);
    const quotation = await quotationService.confirm(principal.tenantId, getParamId(request));
    return { quotation };
  }),

  send: controller(async (request) => {
    const principal = requireTenant(request);
    const quotation = await quotationService.send(principal.tenantId, getParamId(request));
    return { quotation };
  }),

  reject: controller(async (request) => {
    const principal = requireTenant(request);
    const quotation = await quotationService.reject(principal.tenantId, getParamId(request));
    return { quotation };
  }),
};
