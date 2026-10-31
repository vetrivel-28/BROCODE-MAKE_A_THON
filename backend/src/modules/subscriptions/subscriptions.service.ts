import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import type { SubscriptionRole, SubscriptionStatus } from './subscriptions.types.js';
import type { createFromTemplateInput } from './subscriptions.schemas.js';
import type { z } from 'zod';
import { resolveSubscriptionTransition } from './subscriptions.state-machine.js';
import { nextInvoiceDate } from './subscriptions.billing.js';

type CreateFromTemplateInput = z.infer<typeof createFromTemplateInput>;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function listSubscriptions(
  prisma: PrismaClient,
  tenantId: string,
  query: { take: number; cursor?: string; status?: SubscriptionStatus; customerId?: string },
) {
  const rows = await prisma.subscription.findMany({
    where: {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: query.take + 1,
    ...(query.cursor ? { cursor: { tenantId_id: { tenantId, id: query.cursor } }, skip: 1 } : {}),
    include: { plan: true, lines: { include: { product: true } } },
  });
  const hasMore = rows.length > query.take;
  const items = hasMore ? rows.slice(0, query.take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

export async function getSubscription(
  prisma: PrismaClient,
  tenantId: string,
  subscriptionId: string,
  customerId?: string,
) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId, ...(customerId ? { customerId } : {}) },
    include: { plan: true, lines: { include: { product: true } } },
  });
  if (!subscription) throw new Error('Subscription not found in tenant');
  return subscription;
}

export async function createSubscriptionFromTemplate(
  prisma: PrismaClient,
  tenantId: string,
  actorId: string,
  input: CreateFromTemplateInput,
) {
  const existing = await prisma.subscription.findFirst({
    where: { tenantId, idempotencyKey: input.idempotencyKey },
    include: { lines: true, plan: true },
  });
  if (existing) return verifyIdempotentTemplateRequest(existing, input);

  try {
    return await prisma.$transaction(async (transaction) => {
      const template = await transaction.quotationTemplate.findFirst({
        where: { id: input.templateId, tenantId },
        include: { plan: true, lines: true },
      });
      if (!template) throw new Error('Quotation template not found in tenant');
      const plan = template.plan;
      const availableFrom = plan.availableFrom;
      const availableUntil = plan.availableUntil;
      const startDate = new Date(input.startDate);
      if (startDate < startOfUtcDay(new Date())) throw new Error('Subscription start date cannot be in the past');
      if ((availableFrom && startDate < availableFrom) || (availableUntil && startDate > availableUntil)) {
        throw new Error('Plan is unavailable on the requested start date');
      }
      if (input.quantity < plan.minimumQuantity) throw new Error('Minimum plan quantity is not met');

      const now = new Date();
      const quotationExpiresAt = new Date(now);
      quotationExpiresAt.setUTCDate(quotationExpiresAt.getUTCDate() + template.validityDays);
      const subscription = await transaction.subscription.create({
        data: {
          tenantId,
          idempotencyKey: input.idempotencyKey,
          customerId: input.customerId,
          planId: plan.id,
          sourceTemplateId: template.id,
          status: 'QUOTATION',
          startDate,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          quotationExpiresAt,
          quantity: input.quantity,
          paymentTerms: input.paymentTerms,
          lines: {
            create: template.lines.map((line) => ({
              tenantId,
              productId: line.productId,
              quantity: line.quantity * input.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              taxAmount: new Prisma.Decimal(line.amount).mul(input.quantity).mul(line.taxRate).div(100).toDecimalPlaces(2),
              amount: new Prisma.Decimal(line.amount).mul(input.quantity).toDecimalPlaces(2),
            })),
          },
        },
        include: { lines: true, plan: true },
      });
      await transaction.auditEvent.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          actorId,
          eventType: 'QUOTATION_CREATED',
          fromStatus: 'DRAFT',
          toStatus: 'QUOTATION',
          details: {
            templateId: template.id,
            quotationExpiresAt: quotationExpiresAt.toISOString(),
            quantity: input.quantity,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      return subscription;
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    const duplicate = await prisma.subscription.findFirst({
      where: { tenantId, idempotencyKey: input.idempotencyKey },
      include: { lines: true, plan: true },
    });
    if (!duplicate) throw error;
    return verifyIdempotentTemplateRequest(duplicate, input);
  }
}

function verifyIdempotentTemplateRequest(
  existing: {
    id: string;
    customerId: string;
    startDate: Date | null;
    expiryDate: Date | null;
    paymentTerms: string;
    quantity: number;
    sourceTemplateId: string | null;
  },
  input: CreateFromTemplateInput,
) {
  if (
    existing.customerId !== input.customerId
    || existing.startDate?.getTime() !== new Date(input.startDate).getTime()
    || existing.expiryDate?.getTime() !== (input.expiryDate ? new Date(input.expiryDate).getTime() : undefined)
    || existing.paymentTerms !== input.paymentTerms
    || existing.sourceTemplateId !== input.templateId
    || existing.quantity !== input.quantity
  ) {
    throw new Error('Idempotency key was already used with a different subscription request');
  }
  return existing;
}

export async function transitionSubscription(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    subscriptionId: string;
    actorId: string;
    role: SubscriptionRole | 'SYSTEM';
    action: 'submitQuotation' | 'confirm' | 'activate' | 'pause' | 'resume' | 'renew' | 'close';
    idempotencyKey?: string;
    actorOwnsSubscription?: boolean;
    paymentConfirmed?: boolean;
    quotationExpiresAt?: Date;
    startDate?: Date;
    expiryDate?: Date;
  },
) {
  const actionIdempotencyKey = input.idempotencyKey;
  try {
    return await prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.findFirst({
        where: { id: input.subscriptionId, tenantId: input.tenantId },
        include: { plan: true, lines: true },
      });
      if (!subscription) throw new Error('Subscription not found in tenant');
      if (input.role === 'CUSTOMER' && !input.actorOwnsSubscription) {
        throw new Error('Customer does not own this subscription');
      }
      const expectedEventType = input.action === 'submitQuotation' ? 'QUOTATION_CREATED' : input.action.toUpperCase();
      const priorEvent = await transaction.auditEvent.findFirst({
        where: { tenantId: input.tenantId, idempotencyKey: actionIdempotencyKey },
        select: { subscriptionId: true, eventType: true, actorId: true },
      });
      if (priorEvent) {
        if (
          priorEvent.subscriptionId !== input.subscriptionId
          || priorEvent.eventType !== expectedEventType
          || priorEvent.actorId !== input.actorId
        ) {
          throw new Error('Idempotency key was already used for a different action');
        }
        return transaction.subscription.findFirstOrThrow({
          where: { id: input.subscriptionId, tenantId: input.tenantId },
          include: { plan: true, lines: { include: { product: true } } },
        });
      }
    }

      const now = new Date();
      const expired = subscription.expiryDate !== null
        && startOfUtcDay(subscription.expiryDate) < startOfUtcDay(now);
      const effectiveQuotationExpiry = input.action === 'submitQuotation'
        ? input.quotationExpiresAt ?? null
        : subscription.quotationExpiresAt;
      const quantity = subscription.quantity;
      const effectiveStartDate = input.startDate ?? subscription.startDate;
      const planCheckDate = input.action === 'activate'
        ? effectiveStartDate ?? now
        : now;
      const context = {
        role: input.role,
        actorOwnsSubscription: input.actorOwnsSubscription,
        quotationIsValid: effectiveQuotationExpiry !== null && now < effectiveQuotationExpiry,
        planAvailable: (!subscription.plan.availableFrom || planCheckDate >= subscription.plan.availableFrom)
          && (!subscription.plan.availableUntil || planCheckDate <= subscription.plan.availableUntil),
        minimumQuantityMet: quantity >= subscription.plan.minimumQuantity,
        paymentConfirmed: input.paymentConfirmed === true,
        startDateValid: effectiveStartDate !== null && effectiveStartDate >= startOfUtcDay(now),
        planPausable: subscription.plan.pausable,
        planClosable: subscription.plan.closable,
        planRenewable: subscription.plan.renewable,
        planAutoClose: subscription.plan.autoClose,
        isExpired: expired,
      };
      const transition = resolveSubscriptionTransition(subscription.status as SubscriptionStatus, input.action, context);

      const updateData: Prisma.SubscriptionUncheckedUpdateInput = { status: transition.to };
      if (input.action === 'activate') {
        const effectiveExpiryDate = input.expiryDate ?? subscription.expiryDate;
        if (effectiveExpiryDate && effectiveExpiryDate < (effectiveStartDate ?? now)) {
          throw new Error('Subscription expiry must be on or after its start date');
        }
        updateData.startDate = effectiveStartDate;
        updateData.expiryDate = effectiveExpiryDate;
        updateData.nextInvoiceDate = effectiveStartDate;
      }
      if (input.action === 'submitQuotation') {
        if (!input.quotationExpiresAt || input.quotationExpiresAt <= now) {
          throw new Error('Quotation expiry must be in the future');
        }
        updateData.quotationExpiresAt = input.quotationExpiresAt;
      }
      if (input.action === 'renew') {
        if (!subscription.expiryDate) throw new Error('Expiry date is required to renew');
        const renewedExpiry = input.expiryDate ?? nextInvoiceDate(subscription.expiryDate, subscription.plan.billingPeriod);
        if (renewedExpiry <= subscription.expiryDate) throw new Error('Renewal expiry must extend the current term');
        updateData.expiryDate = renewedExpiry;
        updateData.nextInvoiceDate = nextInvoiceDate(
          subscription.nextInvoiceDate ?? subscription.expiryDate,
          subscription.plan.billingPeriod,
        );
      }
      const update = await transaction.subscription.updateMany({
        where: { id: subscription.id, tenantId: input.tenantId, status: subscription.status },
        data: updateData,
      });
      if (update.count !== 1) throw new Error('Subscription changed concurrently; reload and retry');

      await transaction.auditEvent.create({
        data: {
          tenantId: input.tenantId,
          subscriptionId: subscription.id,
          actorId: input.actorId,
          eventType: expectedEventType,
          idempotencyKey: actionIdempotencyKey,
          fromStatus: subscription.status,
          toStatus: transition.to,
          details: input.action === 'renew'
            ? { previousExpiryDate: subscription.expiryDate?.toISOString() }
            : input.action === 'submitQuotation' && input.quotationExpiresAt
              ? { quotationExpiresAt: input.quotationExpiresAt.toISOString() }
              : undefined,
        },
      });
      return transaction.subscription.findFirstOrThrow({
        where: { id: input.subscriptionId, tenantId: input.tenantId },
        include: { plan: true, lines: { include: { product: true } } },
      });
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
    const priorEvent = await prisma.auditEvent.findFirst({
      where: { tenantId: input.tenantId, idempotencyKey: actionIdempotencyKey },
      select: { subscriptionId: true, eventType: true, actorId: true },
    });
    if (!priorEvent) throw error;
    const expectedEventType = input.action === 'submitQuotation' ? 'QUOTATION_CREATED' : input.action.toUpperCase();
    if (
      priorEvent.subscriptionId !== input.subscriptionId
      || priorEvent.eventType !== expectedEventType
      || priorEvent.actorId !== input.actorId
    ) {
      throw new Error('Idempotency key was already used for a different action');
    }
    if (input.role === 'CUSTOMER' && !input.actorOwnsSubscription) {
      throw new Error('Customer does not own this subscription');
    }
    return prisma.subscription.findFirstOrThrow({
      where: { id: input.subscriptionId, tenantId: input.tenantId },
      include: { plan: true, lines: { include: { product: true } } },
    });
  }
}

export async function getSubscriptionTimeline(
  prisma: PrismaClient,
  tenantId: string,
  subscriptionId: string,
  page: { take: number; cursor?: string },
) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId },
    select: { id: true },
  });
  if (!subscription) throw new Error('Subscription not found in tenant');
  const events = await prisma.auditEvent.findMany({
    where: { tenantId, subscriptionId },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: page.take + 1,
    ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
  });
  const hasMore = events.length > page.take;
  const items = (hasMore ? events.slice(0, page.take) : events).reverse();
  return {
    items,
    nextCursor: hasMore ? events[page.take - 1]?.id ?? null : null,
  };
}

export async function closeExpiredSubscriptions(prisma: PrismaClient, tenantId: string, now = new Date()) {
  return prisma.$transaction(async (transaction) => {
    let closed = 0;
    while (true) {
      const expired = await transaction.subscription.findMany({
        where: {
          tenantId,
          status: { in: ['ACTIVE', 'PAUSED'] },
          expiryDate: { lt: startOfUtcDay(now) },
          plan: { autoClose: true },
        },
        select: { id: true, tenantId: true, status: true },
        orderBy: { id: 'asc' },
        take: 500,
      });
      if (expired.length === 0) break;
      for (const subscription of expired) {
        const result = await transaction.subscription.updateMany({
          where: { id: subscription.id, tenantId, status: subscription.status },
          data: { status: 'CLOSED' },
        });
        if (result.count === 1) {
          await transaction.auditEvent.create({
            data: {
              tenantId,
              subscriptionId: subscription.id,
              eventType: 'AUTO_CLOSED',
              fromStatus: subscription.status,
              toStatus: 'CLOSED',
              details: { closedAt: now.toISOString() },
            },
          });
          closed += 1;
        }
      }
    }
    return { closed };
  });
}
