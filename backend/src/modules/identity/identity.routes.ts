import { Router } from "express";
import { identityController } from "./identity.controller.js";
import { authenticate } from "./middleware/authenticate.middleware.js";

export const identityRouter = Router();

identityRouter.post("/signup", identityController.signup);
identityRouter.post("/login", identityController.login);
identityRouter.post("/refresh", identityController.refresh);
identityRouter.post("/logout", authenticate, identityController.logout);
identityRouter.get("/me", authenticate, identityController.me);
identityRouter.post("/request-password-reset", identityController.requestPasswordReset);
identityRouter.post("/reset-password", identityController.resetPassword);
