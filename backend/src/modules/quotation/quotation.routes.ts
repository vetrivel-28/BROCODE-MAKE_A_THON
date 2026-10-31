import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { quotationController } from "./quotation.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const quotationRouter = Router();

quotationRouter.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  quotationController.list,
);
quotationRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  quotationController.create,
);
quotationRouter.get("/:id", authenticate, quotationController.getById);
quotationRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  quotationController.update,
);
quotationRouter.post(
  "/:id/confirm",
  authenticate,
  authorize(UserRole.ADMIN),
  quotationController.confirm,
);
quotationRouter.post(
  "/:id/send",
  authenticate,
  authorize(UserRole.ADMIN),
  quotationController.send,
);
quotationRouter.post(
  "/:id/reject",
  authenticate,
  authorize(UserRole.ADMIN),
  quotationController.reject,
);
