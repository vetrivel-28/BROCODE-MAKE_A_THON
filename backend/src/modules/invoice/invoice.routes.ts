import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { invoiceController } from "./invoice.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const invoiceRouter = Router();

invoiceRouter.get("/", authenticate, invoiceController.list);
invoiceRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  invoiceController.create,
);
invoiceRouter.get("/:id", authenticate, invoiceController.getById);
invoiceRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  invoiceController.update,
);
invoiceRouter.post(
  "/:id/confirm",
  authenticate,
  authorize(UserRole.ADMIN),
  invoiceController.confirm,
);
invoiceRouter.post(
  "/:id/void",
  authenticate,
  authorize(UserRole.ADMIN),
  invoiceController.void,
);
