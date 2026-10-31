import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { invoiceService } from "./invoice.service.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoicesSchema,
} from "./invoice.validation.js";

export const invoiceController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const filters = listInvoicesSchema.parse(request.query);
    const result = await invoiceService.list(principal.tenantId, filters);
    return result;
  }),

  getById: controller(async (request) => {
    const principal = requireTenant(request);
    const invoice = await invoiceService.getById(principal.tenantId, getParamId(request));
    return { invoice };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createInvoiceSchema.parse(request.body);
      const invoice = await invoiceService.create(principal.tenantId, input);
      return { invoice };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateInvoiceSchema.parse(request.body);
    const invoice = await invoiceService.update(principal.tenantId, getParamId(request), input);
    return { invoice };
  }),

  confirm: controller(async (request) => {
    const principal = requireTenant(request);
    const invoice = await invoiceService.confirm(principal.tenantId, getParamId(request));
    return { invoice };
  }),

  void: controller(async (request) => {
    const principal = requireTenant(request);
    const invoice = await invoiceService.void(principal.tenantId, getParamId(request));
    return { invoice };
  }),
};
