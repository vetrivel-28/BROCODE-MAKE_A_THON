import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { paymentController } from "./payment.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const paymentRouter = Router();

paymentRouter.post(
  "/subscription/order",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentController.createSubscriptionOrder,
);

paymentRouter.post(
  "/subscription/verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentController.verifySubscriptionPayment,
);

paymentRouter.post(
  "/invoice/order",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentController.createInvoiceOrder,
);

paymentRouter.post(
  "/invoice/verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentController.verifyInvoicePayment,
);

