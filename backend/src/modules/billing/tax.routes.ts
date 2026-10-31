import { Router } from 'express';
import { taxController } from './tax.controller.js';
import { authorize } from './contracts.js';

export const taxRoutes = Router();

// STAFF and SUPER_ADMIN can read taxes; ADMIN can read and write
taxRoutes.get('/taxes', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  taxController.getTaxes(req, res);
});

taxRoutes.get('/taxes/:id', authorize('ADMIN', 'STAFF', 'SUPER_ADMIN'), (req, res) => {
  taxController.getTaxById(req, res);
});

// ADMIN only can create and update taxes
taxRoutes.post('/taxes', authorize('ADMIN'), (req, res) => {
  taxController.createTax(req, res);
});

taxRoutes.patch('/taxes/:id', authorize('ADMIN'), (req, res) => {
  taxController.updateTax(req, res);
});

