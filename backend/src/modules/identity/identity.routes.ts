import { Router } from 'express';
import { IdentityController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';
import { authorize } from '../../common/auth.middleware.js';

export function createIdentityRouter(service?: IdentityService): Router {
  const router = Router();
  const identityService = service || new IdentityService();
  const controller = new IdentityController(identityService);

  // Public Auth Endpoints
  router.post('/signup', controller.signup);
  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/forgot-password', controller.forgotPassword);
  router.post('/reset-password', controller.resetPassword);

  // Authenticated Endpoints
  router.get('/me', authorize(), controller.me);
  router.get('/passport', authorize(), controller.getPassport);

  // ADMIN / SUPER_ADMIN Only
  router.post('/staff', authorize('ADMIN', 'SUPER_ADMIN'), controller.createStaff);
  router.post('/customer-user', authorize('ADMIN', 'STAFF'), controller.createCustomerUser);
  router.get('/users', authorize('ADMIN', 'STAFF'), controller.listUsers);
  router.post('/upgrade', authorize('ADMIN'), controller.upgradeTier);

  return router;
}

export default createIdentityRouter;

