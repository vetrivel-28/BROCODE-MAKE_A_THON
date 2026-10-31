import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { productService } from "./product.service.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from "./product.validation.js";

export const productController = {
  list: controller(async (request) => {
    const principal = requireTenant(request);
    const filters = listProductsSchema.parse(request.query);
    const result = await productService.list(principal.tenantId, filters);
    return result;
  }),

  getById: controller(async (request) => {
    const principal = requireTenant(request);
    const product = await productService.getById(principal.tenantId, getParamId(request));
    return { product };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createProductSchema.parse(request.body);
      const product = await productService.create(principal.tenantId, input);
      return { product };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateProductSchema.parse(request.body);
    const product = await productService.update(principal.tenantId, getParamId(request), input);
    return { product };
  }),

  archive: controller(async (request) => {
    const principal = requireTenant(request);
    const product = await productService.archive(principal.tenantId, getParamId(request));
    return { product };
  }, 200),
};
