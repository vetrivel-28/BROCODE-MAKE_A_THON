import type { RequestHandler } from 'express';
import type { PrismaClient } from '../../generated/prisma/client.js';

export type CatalogRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export interface CatalogRequestContext {
  tenantId: string;
  actorId: string;
}

export interface CatalogRouteDependencies {
  prisma: PrismaClient;
  context: (request: Parameters<RequestHandler>[0]) => CatalogRequestContext;
  requireRole: (...roles: CatalogRole[]) => RequestHandler;
  can: (tenantId: string, feature: string) => Promise<boolean>;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export const CATALOG_FEATURES = {
  products: 'catalog.products',
  plans: 'catalog.plans',
  templates: 'catalog.quotationTemplates',
  discounts: 'catalog.discounts',
} as const;
