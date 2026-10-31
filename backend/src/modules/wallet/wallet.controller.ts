import { controller, requireTenant, getPrincipal } from "../../shared/controller.js";
import { walletService } from "./wallet.service.js";
import { z } from "zod";
import { Decimal } from "../../shared/decimal.js";

const creditSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const walletController = {
  get: controller(async (request) => {
    const principal = requireTenant(request);
    const wallet = await walletService.get(principal.tenantId);
    return { wallet };
  }),

  getTransactions: controller(async (request) => {
    const principal = requireTenant(request);
    const { page, limit } = transactionsQuerySchema.parse(request.query);
    const result = await walletService.getTransactions(principal.tenantId, page, limit);
    return result;
  }),

  credit: controller(async (request) => {
    const principal = requireTenant(request);
    const input = creditSchema.parse(request.body);
    const transaction = await walletService.credit(
      principal.tenantId,
      new Decimal(input.amount),
      input.description,
      input.idempotencyKey,
    );
    return { transaction };
  }, 201),
};
