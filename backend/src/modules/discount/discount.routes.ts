import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { discountController } from "./discount.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const discountRouter = Router();

discountRouter.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  discountController.list,
);
discountRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  discountController.create,
);
// /validate must come before /:id to avoid route collision
discountRouter.post(
  "/validate",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  discountController.validate,
);
discountRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  discountController.update,
);
discountRouter.post(
  "/:id/toggle",
  authenticate,
  authorize(UserRole.ADMIN),
  discountController.toggle,
);
