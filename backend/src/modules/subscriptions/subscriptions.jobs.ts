import type { PrismaClient } from '../../generated/prisma/client.js';
import { closeExpiredSubscriptions } from './subscriptions.service.js';

export async function runNightlySubscriptionAutoClose(prisma: PrismaClient, tenantId: string, now = new Date()) {
  return closeExpiredSubscriptions(prisma, tenantId, now);
}
