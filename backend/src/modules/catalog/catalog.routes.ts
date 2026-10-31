import { Router } from 'express';
import { catalogControllers } from './catalog.controller.js';
import { CATALOG_FEATURES, type CatalogRouteDependencies } from './catalog.types.js';

export function createCatalogRouter(dependencies: CatalogRouteDependencies): Router {
  const router = Router();
  const controllers = catalogControllers(dependencies);
  const admin = dependencies.requireRole('ADMIN');
  const catalogEditor = dependencies.requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF');
  const productAccess = async (request: Parameters<typeof admin>[0], response: Parameters<typeof admin>[1], next: Parameters<typeof admin>[2]) => {
    try {
      const tenantId = dependencies.context(request).tenantId;
      if (!await dependencies.can(tenantId, CATALOG_FEATURES.products)) {
        response.status(403).json({ error: 'Product catalog is not available on this tier' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  const planAccess = async (request: Parameters<typeof admin>[0], response: Parameters<typeof admin>[1], next: Parameters<typeof admin>[2]) => {
    try {
      const tenantId = dependencies.context(request).tenantId;
      if (!await dependencies.can(tenantId, CATALOG_FEATURES.plans)) {
        response.status(403).json({ error: 'Plan management is not available on this tier' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  const templateAccess = async (request: Parameters<typeof admin>[0], response: Parameters<typeof admin>[1], next: Parameters<typeof admin>[2]) => {
    try {
      const tenantId = dependencies.context(request).tenantId;
      if (!await dependencies.can(tenantId, CATALOG_FEATURES.templates)) {
        response.status(403).json({ error: 'Quotation templates are not available on this tier' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  const discountAccess = async (request: Parameters<typeof admin>[0], response: Parameters<typeof admin>[1], next: Parameters<typeof admin>[2]) => {
    try {
      const tenantId = dependencies.context(request).tenantId;
      if (!await dependencies.can(tenantId, CATALOG_FEATURES.discounts)) {
        response.status(403).json({ error: 'Discount management is not available on this tier' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  router.get('/products', catalogEditor, productAccess, controllers.listProducts);
  router.post('/products', catalogEditor, productAccess, controllers.createProduct);
  router.get('/plans', admin, planAccess, controllers.listPlans);
  router.post('/plans', admin, planAccess, controllers.createPlan);
  router.get('/quotation-templates', catalogEditor, templateAccess, controllers.listTemplates);
  router.post('/quotation-templates', catalogEditor, templateAccess, controllers.createTemplate);
  router.get('/discounts', admin, discountAccess, controllers.listDiscounts);
  router.post('/discounts', admin, discountAccess, controllers.createDiscount);
  router.put('/discounts/:discountId', admin, discountAccess, controllers.updateDiscount);
  router.get('/discounts/seat-suggestions', admin, discountAccess, controllers.seatSuggestions);
  return router;
}
