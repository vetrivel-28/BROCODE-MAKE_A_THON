import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { walletController } from "./wallet.controller.js";
import { UserRole } from "../../generated/prisma/enums.js";

export const walletRouter = Router();

walletRouter.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF),
  walletController.get,
);
walletRouter.get("/transactions", authenticate, walletController.getTransactions);
walletRouter.post(
  "/credit",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  walletController.credit,
);
