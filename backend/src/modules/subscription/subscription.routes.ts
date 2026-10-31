import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { subscriptionController } from "./subscription.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const subscriptionRouter = Router();

subscriptionRouter.get("/plans", subscriptionController.getPlans);
subscriptionRouter.get("/", authenticate, subscriptionController.list);
subscriptionRouter.post("/", authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), subscriptionController.create);
subscriptionRouter.get("/:id", authenticate, subscriptionController.getById);
subscriptionRouter.patch("/:id", authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), subscriptionController.update);
subscriptionRouter.post("/:id/change-plan", authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), subscriptionController.changePlan);
subscriptionRouter.post("/:id/close", authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), subscriptionController.close);

