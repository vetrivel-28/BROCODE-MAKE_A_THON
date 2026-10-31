import { controller, requireTenant } from "../../shared/controller.js";
import { paymentService } from "./payment.service.js";
import {
  createSubscriptionOrderSchema,
  verifySubscriptionPaymentSchema,
  createInvoiceOrderSchema,
  verifyInvoicePaymentSchema,
} from "./payment.validation.js";

export const paymentController = {
  createSubscriptionOrder: controller(async (request) => {
    const principal = requireTenant(request);
    const { subscriptionId } = createSubscriptionOrderSchema.parse(request.body);
    const order = await paymentService.createSubscriptionOrder(
      principal.tenantId,
      subscriptionId,
    );
    return { order };
  }, 201),

  verifySubscriptionPayment: controller(async (request) => {
    const principal = requireTenant(request);
    const input = verifySubscriptionPaymentSchema.parse(request.body);
    const result = await paymentService.verifySubscriptionPayment(
      principal.tenantId,
      input.subscriptionId,
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    return { success: true, ...result };
  }),

  createInvoiceOrder: controller(async (request) => {
    const principal = requireTenant(request);
    const { invoiceId } = createInvoiceOrderSchema.parse(request.body);
    const order = await paymentService.createInvoiceOrder(principal.tenantId, invoiceId);
    return { order };
  }, 201),

  verifyInvoicePayment: controller(async (request) => {
    const principal = requireTenant(request);
    const input = verifyInvoicePaymentSchema.parse(request.body);
    const result = await paymentService.verifyInvoicePayment(
      principal.tenantId,
      input.invoiceId,
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );
    return { success: true, ...result };
  }),
};

