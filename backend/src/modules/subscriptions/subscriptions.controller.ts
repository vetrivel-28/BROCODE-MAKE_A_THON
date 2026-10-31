import type { NextFunction, Request, Response } from 'express';
import type { SubscriptionRouteDependencies } from './subscriptions.types.js';
import {
  createSubscriptionFromTemplate,
  getSubscription,
  getSubscriptionTimeline,
  listSubscriptions,
  transitionSubscription,
} from './subscriptions.service.js';
import { getApplicableDiscounts } from './subscriptions.discounts.js';
import { getDueSubscriptions } from './subscriptions.billing.js';
import {
  createFromTemplateInput,
  applicableDiscountsQuery,
  dueSubscriptionQuery,
  recordDiscountUsageInput,
  subscriptionListQuery,
  subscriptionParams,
  timelineQuery,
  transitionInput,
} from './subscriptions.schemas.js';
import { recordDiscountUsage } from './subscriptions.discounts.js';

function handler(
  operation: (request: Request, response: Response, dependencies: SubscriptionRouteDependencies) => Promise<unknown>,
  dependencies: SubscriptionRouteDependencies,
) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await operation(request, response, dependencies);
      if (!response.headersSent) {
        const serializable = JSON.parse(JSON.stringify(result, (_key, value: unknown) =>
          typeof value === 'bigint' ? value.toString() : value));
        response.json(serializable);
      }
    } catch (error) {
      next(error);
    }
  };
}

export function subscriptionsControllers(dependencies: SubscriptionRouteDependencies) {
  const createFromTemplate = handler(async (request, response) => {
    const context = dependencies.context(request);
    const input = createFromTemplateInput.parse(request.body);
    await dependencies.assertCustomerInTenant(context.tenantId, input.customerId);
    response.status(201);
    return createSubscriptionFromTemplate(dependencies.prisma, context.tenantId, context.actorId, input);
  }, dependencies);

  const list = handler(async (request) => {
    const context = dependencies.context(request);
    const query = subscriptionListQuery.parse(request.query);
    if (context.role === 'CUSTOMER' && !context.customerId) throw new Error('Customer identity is required');
    return listSubscriptions(dependencies.prisma, context.tenantId, {
      ...query,
      customerId: context.role === 'CUSTOMER' ? context.customerId : query.customerId,
    });
  }, dependencies);

  const details = handler(async (request) => {
    const context = dependencies.context(request);
    const { subscriptionId } = subscriptionParams.parse(request.params);
    if (context.role === 'CUSTOMER' && !context.customerId) throw new Error('Customer identity is required');
    return getSubscription(dependencies.prisma, context.tenantId, subscriptionId, context.role === 'CUSTOMER' ? context.customerId : undefined);
  }, dependencies);

  const transition = handler(async (request) => {
    const context = dependencies.context(request);
    const { subscriptionId } = subscriptionParams.parse(request.params);
    const input = transitionInput.parse(request.body);
    const owned = context.role === 'CUSTOMER' && context.customerId
      ? await dependencies.prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          tenantId: context.tenantId,
          customerId: context.customerId,
        },
        select: { id: true },
      })
      : null;
    const paymentConfirmed = input.action === 'activate'
      ? await dependencies.paymentIsConfirmed(context.tenantId, subscriptionId)
      : false;
    return transitionSubscription(dependencies.prisma, {
      tenantId: context.tenantId,
      subscriptionId,
      actorId: context.actorId,
      role: context.role,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
      actorOwnsSubscription: Boolean(owned),
      paymentConfirmed,
      quotationExpiresAt: input.quotationExpiresAt ? new Date(input.quotationExpiresAt) : undefined,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
    });
  }, dependencies);

  const timeline = handler(async (request) => {
    const context = dependencies.context(request);
    const { subscriptionId } = subscriptionParams.parse(request.params);
    const page = timelineQuery.parse(request.query);
    if (context.role === 'CUSTOMER') {
      if (!context.customerId) throw new Error('Customer identity is required');
      const owned = await dependencies.prisma.subscription.findFirst({
        where: { id: subscriptionId, tenantId: context.tenantId, customerId: context.customerId },
        select: { id: true },
      });
      if (!owned) throw new Error('Subscription not found in tenant');
    }
    return getSubscriptionTimeline(dependencies.prisma, context.tenantId, subscriptionId, page);
  }, dependencies);

  const applicableDiscounts = handler(async (request) => {
    const context = dependencies.context(request);
    const { subscriptionId } = subscriptionParams.parse(request.params);
    const query = applicableDiscountsQuery.parse(request.query);
    return dependencies.prisma.$transaction((prisma) =>
      getApplicableDiscounts({ prisma, tenantId: context.tenantId }, subscriptionId, new Date(query.periodStart)));
  }, dependencies);

  const due = handler(async (request) => {
    const context = dependencies.context(request);
    const query = dueSubscriptionQuery.parse(request.query);
    return dependencies.prisma.$transaction((prisma) => getDueSubscriptions(
      { prisma, tenantId: context.tenantId },
      query.asOf ? new Date(query.asOf) : new Date(),
      { take: query.take, cursor: query.cursor },
    ));
  }, dependencies);

  const recordUsage = handler(async (request) => {
    const context = dependencies.context(request);
    const input = recordDiscountUsageInput.parse(request.body);
    return dependencies.prisma.$transaction((prisma) =>
      recordDiscountUsage({ prisma, tenantId: context.tenantId }, input.discountId, input.invoiceId));
  }, dependencies);

  return { createFromTemplate, list, details, transition, timeline, applicableDiscounts, due, recordUsage };
}
