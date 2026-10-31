import { controller, getParamId, requireTenant } from "../../shared/controller.js";
import { subscriptionService } from "./subscription.service.js";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  changeSubscriptionPlanSchema,
} from "./subscription.validation.js";

export const subscriptionController = {
  getPlans: controller(async () => {
    const plans = await subscriptionService.getPlans();
    return { plans };
  }),

  list: controller(async (request) => {
    const principal = requireTenant(request);
    const subscriptions = await subscriptionService.list(principal.tenantId);
    return { subscriptions };
  }),

  getById: controller(async (request) => {
    const principal = requireTenant(request);
    const subscription = await subscriptionService.getById(
      principal.tenantId,
      getParamId(request),
    );
    return { subscription };
  }),

  create: controller(
    async (request) => {
      const principal = requireTenant(request);
      const input = createSubscriptionSchema.parse(request.body);
      const subscription = await subscriptionService.create(principal.tenantId, input);
      return { subscription };
    },
    201,
  ),

  update: controller(async (request) => {
    const principal = requireTenant(request);
    const input = updateSubscriptionSchema.parse(request.body);
    const subscription = await subscriptionService.update(
      principal.tenantId,
      getParamId(request),
      input,
    );
    return { subscription };
  }),

  changePlan: controller(async (request) => {
    const principal = requireTenant(request);
    const input = changeSubscriptionPlanSchema.parse(request.body);
    const subscription = await subscriptionService.changePlan(
      principal.tenantId,
      getParamId(request),
      input,
    );
    return { subscription };
  }),

  close: controller(async (request) => {
    const principal = requireTenant(request);
    const subscription = await subscriptionService.close(
      principal.tenantId,
      getParamId(request),
    );
    return { subscription };
  }),
};

