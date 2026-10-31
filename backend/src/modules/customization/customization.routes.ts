import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { customizationController } from "./customization.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const customizationRouter = Router();

customizationRouter.get("/", authenticate, customizationController.list);
customizationRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  customizationController.request,
);
customizationRouter.get("/:id", authenticate, customizationController.getById);
