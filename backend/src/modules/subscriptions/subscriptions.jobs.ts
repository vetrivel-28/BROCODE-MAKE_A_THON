import type { PrismaClient } from '../../generated/prisma/client.js';
import { closeExpiredSubscriptions } from './subscriptions.service.js';
import { nextSubscriptionAutoCloseAt } from './subscriptions.jobs.logic.js';
export { nextSubscriptionAutoCloseAt } from './subscriptions.jobs.logic.js';

export async function runNightlySubscriptionAutoClose(prisma: PrismaClient, tenantId: string, now = new Date()) {
  return closeExpiredSubscriptions(prisma, tenantId, now);
}

export async function runSubscriptionAutoCloseNow(
  prisma: PrismaClient,
  onError: (error: unknown, tenantId?: string) => void = (error, tenantId) => {
    console.error('Subscription auto-close failed', { tenantId, error });
  },
  now = new Date(),
) {
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  const completedTenantIds: string[] = [];
  for (const tenant of tenants) {
    try {
      await runNightlySubscriptionAutoClose(prisma, tenant.id, now);
      completedTenantIds.push(tenant.id);
    } catch (error) {
      onError(error, tenant.id);
    }
  }
  return completedTenantIds;
}

export function registerSubscriptionJobs(
  prisma: PrismaClient,
  onError?: (error: unknown, tenantId?: string) => void,
): { stop: () => void; runNow: () => ReturnType<typeof runSubscriptionAutoCloseNow> } {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const reportError = onError ?? ((error, tenantId) => {
    console.error('Subscription auto-close failed', { tenantId, error });
  });
  const schedule = () => {
    const delay = nextSubscriptionAutoCloseAt().getTime() - Date.now();
    timer = setTimeout(() => {
      void runSubscriptionAutoCloseNow(prisma, reportError)
        .catch((error: unknown) => reportError(error))
        .finally(() => {
          if (!stopped) schedule();
        });
    }, delay);
  };
  schedule();
  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
    runNow: () => runSubscriptionAutoCloseNow(prisma, reportError),
  };
}
