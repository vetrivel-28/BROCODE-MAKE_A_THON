import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors.js";
import { Decimal } from "../../shared/decimal.js";

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

async function createRazorpayOrder(
  amountPaise: number,
  currency: string,
  receipt: string,
): Promise<RazorpayOrderResponse> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(
      "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      503,
      "PAYMENT_NOT_CONFIGURED",
    );
  }

  const credentials = Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Razorpay order creation failed:", body);
    throw new AppError("Failed to create payment order", 502, "PAYMENT_ORDER_FAILED");
  }

  return response.json() as Promise<RazorpayOrderResponse>;
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expectedSignature = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(rawBody)
    .digest("hex");
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

export const paymentService = {
  async createSubscriptionOrder(tenantId: string, subscriptionId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });
    if (!subscription) {
      throw new AppError("Subscription not found", 404, "NOT_FOUND");
    }
    if (!["CONFIRMED", "DRAFT"].includes(subscription.status)) {
      throw new AppError(
        "Only CONFIRMED or DRAFT subscriptions can initiate payment",
        400,
        "INVALID_STATUS",
      );
    }
    if (subscription.priceSnapshot.isZero()) {
      throw new AppError(
        "Free subscriptions do not require payment",
        400,
        "FREE_PLAN_NO_PAYMENT",
      );
    }

    // Convert to paise (1 INR = 100 paise)
    const amountPaise = subscription.priceSnapshot.mul(100).toFixed(0);
    const receipt = `sub_${subscriptionId.slice(-8)}`;

    const order = await createRazorpayOrder(
      parseInt(amountPaise, 10),
      subscription.currency,
      receipt,
    );

    // Store the order ID
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { razorpayOrderId: order.id },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  async createInvoiceOrder(tenantId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) {
      throw new AppError("Invoice not found", 404, "NOT_FOUND");
    }
    if (invoice.status !== "CONFIRMED") {
      throw new AppError("Only CONFIRMED invoices can be paid", 400, "INVALID_STATUS");
    }
    if (invoice.paymentStatus === "CAPTURED") {
      throw new AppError("Invoice is already paid", 400, "ALREADY_PAID");
    }

    const amountPaise = invoice.total.mul(100).toFixed(0);
    const receipt = `inv_${invoiceId.slice(-8)}`;

    const order = await createRazorpayOrder(
      parseInt(amountPaise, 10),
      invoice.currency,
      receipt,
    );

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { razorpayOrderId: order.id },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  async verifySubscriptionPayment(
    tenantId: string,
    subscriptionId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isValid) {
      throw new AppError("Payment signature verification failed", 400, "INVALID_SIGNATURE");
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        tenantId,
        razorpayOrderId,
      },
    });
    if (!subscription) {
      throw new AppError(
        "Subscription not found or order ID mismatch",
        400,
        "ORDER_MISMATCH",
      );
    }

    if (subscription.razorpayPaymentId) {
      // Idempotent - already processed
      return { alreadyProcessed: true };
    }

    // Activate the subscription
    const now = new Date();
    const endsAt = new Date(now);
    if (subscription.billingInterval === "MONTHLY") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else if (subscription.billingInterval === "YEARLY") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    await prisma.$transaction(async (tx) => {
      // Close any other active subscriptions
      await tx.subscription.updateMany({
        where: {
          tenantId,
          status: "ACTIVE",
          id: { not: subscriptionId },
        },
        data: { status: "CLOSED", canceledAt: now },
      });

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          razorpayPaymentId,
          startsAt: now,
          endsAt: subscription.billingInterval === "ONE_TIME" ? null : endsAt,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: "PAYMENT_CAPTURED",
          entityId: subscriptionId,
          entityType: "Subscription",
          metadata: { razorpayOrderId, razorpayPaymentId },
        },
      });
    });

    return { alreadyProcessed: false };
  },

  async verifyInvoicePayment(
    tenantId: string,
    invoiceId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isValid) {
      throw new AppError("Payment signature verification failed", 400, "INVALID_SIGNATURE");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, razorpayOrderId },
    });
    if (!invoice) {
      throw new AppError("Invoice not found or order ID mismatch", 400, "ORDER_MISMATCH");
    }
    if (invoice.paymentStatus === "CAPTURED") {
      return { alreadyProcessed: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paymentStatus: "CAPTURED",
          razorpayPaymentId,
          paidAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: "INVOICE_PAID",
          entityId: invoiceId,
          entityType: "Invoice",
          metadata: { razorpayOrderId, razorpayPaymentId },
        },
      });
    });

    return { alreadyProcessed: false };
  },

  getRazorpayKeyId() {
    return env.RAZORPAY_KEY_ID;
  },
};

