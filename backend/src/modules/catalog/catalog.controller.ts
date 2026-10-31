import type { Request, Response, NextFunction } from 'express';
import type { CatalogRouteDependencies } from './catalog.types.js';
import {
  createDiscount,
  createPlan,
  createProduct,
  createTemplate,
  listDiscounts,
  listPlans,
  listProducts,
  listTemplates,
  suggestSeatDiscounts,
} from './catalog.service.js';
import { discountInput, listQuery, planInput, productInput, seatSuggestionQuery, templateInput } from './catalog.schemas.js';

function parse<T>(schema: { parse: (data: unknown) => T }, value: unknown): T {
  return schema.parse(value);
}

function handler(
  operation: (request: Request, response: Response, dependencies: CatalogRouteDependencies) => Promise<unknown>,
  dependencies: CatalogRouteDependencies,
) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await operation(request, response, dependencies);
      if (!response.headersSent) response.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export function catalogControllers(dependencies: CatalogRouteDependencies) {
  const list = (kind: 'products' | 'plans' | 'templates' | 'discounts') => handler(async (request) => {
    const context = dependencies.context(request);
    const query = parse(listQuery, request.query);
    const methods = { products: listProducts, plans: listPlans, templates: listTemplates, discounts: listDiscounts };
    return methods[kind](dependencies.prisma, context.tenantId, query.take, query.cursor);
  }, dependencies);

  const create = <Input,>(
    schema: { parse: (data: unknown) => Input },
    method: (prisma: CatalogRouteDependencies['prisma'], tenantId: string, input: Input) => Promise<unknown>,
  ) => handler(async (request, response) => {
    const context = dependencies.context(request);
    const result = await method(dependencies.prisma, context.tenantId, parse(schema, request.body));
    response.status(201);
    return result;
  }, dependencies);

  const seatSuggestions = handler(async (request) => {
    const context = dependencies.context(request);
    const query = parse(seatSuggestionQuery, request.query);
    return suggestSeatDiscounts(
      dependencies.prisma,
      context.tenantId,
      query.currentSeats,
      query.suggestedSeats,
      { take: query.take, cursor: query.cursor },
    );
  }, dependencies);

  return {
    listProducts: list('products'),
    createProduct: create(productInput, createProduct),
    listPlans: list('plans'),
    createPlan: create(planInput, createPlan),
    listTemplates: list('templates'),
    createTemplate: create(templateInput, createTemplate),
    listDiscounts: list('discounts'),
    createDiscount: create(discountInput, createDiscount),
    seatSuggestions,
  };
}
