import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { productController } from "./product.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const productRouter = Router();

productRouter.get("/", authenticate, productController.list);
productRouter.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  productController.create,
);
productRouter.get("/:id", authenticate, productController.getById);
productRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  productController.update,
);
productRouter.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  productController.archive,
);
