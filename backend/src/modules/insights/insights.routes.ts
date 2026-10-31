import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { insightsController } from "./insights.controller.js";

export const insightsRouter = Router();

insightsRouter.get("/", authenticate, insightsController.getInsights);
