import { controller, requireTenant } from "../../shared/controller.js";
import { passportService } from "./passport.service.js";

export const passportController = {
  getPassport: controller(async (request) => {
    const principal = requireTenant(request);
    const passport = await passportService.getPassport(principal.tenantId);
    return { passport };
  }),
};
