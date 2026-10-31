import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { passportController } from "./passport.controller.js";

export const passportRouter = Router();

passportRouter.get("/", authenticate, passportController.getPassport);
