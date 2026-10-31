import { z } from "zod";
import { Router } from "express";
import { authenticate } from "../identity/middleware/authenticate.middleware.js";
import { authorize } from "../../shared/authorize.middleware.js";
import { controller, requireTenant } from "../../shared/controller.js";
import { starterPackService } from "./starterPacks.service.js";
import { UserRole } from "../../generated/prisma/enums.js";

const applyPackSchema = z.object({
  industry: z.enum(["retail", "saas", "gym", "coaching"]),
}).strict();

export const starterPacksRouter = Router();

starterPacksRouter.get(
  "/",
  (_, res) => {
    res.json({ packs: starterPackService.getAvailablePacks() });
  },
);

starterPacksRouter.post(
  "/apply",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  controller(async (request) => {
    const principal = requireTenant(request);
    const { industry } = applyPackSchema.parse(request.body);
    const result = await starterPackService.apply(principal.tenantId, industry);
    return result;
  }, 201),
);

