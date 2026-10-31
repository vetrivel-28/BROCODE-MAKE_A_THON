import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { taxController } from "./tax.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const taxRouter = Router();

taxRouter.get("/", authenticate, taxController.list);
taxRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  taxController.create,
);
taxRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  taxController.update,
);
taxRouter.post(
  "/:id/toggle",
  authenticate,
  authorize(UserRole.ADMIN),
  taxController.toggle,
);
