import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { createRateLimiter } from "./shared/rateLimit.js";
import { identityRouter } from "./modules/identity/identity.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { subscriptionRouter } from "./modules/subscription/subscription.routes.js";
import { quotationRouter } from "./modules/quotation/quotation.routes.js";
import { invoiceRouter } from "./modules/invoice/invoice.routes.js";
import { productRouter } from "./modules/product/product.routes.js";
import { taxRouter } from "./modules/tax/tax.routes.js";
import { discountRouter } from "./modules/discount/discount.routes.js";
import { walletRouter } from "./modules/wallet/wallet.routes.js";
import { customizationRouter } from "./modules/customization/customization.routes.js";
import { passportRouter } from "./modules/passport/passport.routes.js";
import { insightsRouter } from "./modules/insights/insights.routes.js";
import { paymentRouter } from "./modules/payment/payment.routes.js";
import { starterPacksRouter } from "./modules/starter-packs/starterPacks.routes.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(express.json());

// Rate limiting for auth routes (15 requests per 15 minutes)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: {
    error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests, please try again later." },
  },
});

app.use("/api", healthRouter);
app.use("/api/identity/signup", authLimiter);
app.use("/api/identity/login", authLimiter);
app.use("/api/identity", identityRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/quotations", quotationRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/products", productRouter);
app.use("/api/taxes", taxRouter);
app.use("/api/discounts", discountRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/customizations", customizationRouter);
app.use("/api/passport", passportRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/starter-packs", starterPacksRouter);
