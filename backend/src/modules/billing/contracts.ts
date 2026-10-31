import { Request, Response, NextFunction } from 'express';

// =============================================================================
// ROLE & AUTH CONTRACTS (P1)
// =============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * P1 Authorization Middleware Stub
 * Verifies role against allowed roles.
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In dev / test or if user header supplied:
    const userRole = (req.headers['x-user-role'] as UserRole) || (req.user ? req.user.role : 'ADMIN');
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.user ? req.user.tenantId : 'tenant_default');
    const userId = (req.headers['x-user-id'] as string) || (req.user ? req.user.id : 'user_default');
    const email = (req.headers['x-user-email'] as string) || 'admin@loopdesk.io';

    req.user = {
      id: userId,
      tenantId,
      role: userRole,
      email,
    };

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Role ${req.user.role} is not authorized for this resource. Required: ${roles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * P1 Feature Gating Stub: can(tenantId, feature)
 */
export async function can(tenantId: string, feature: string): Promise<boolean> {
  // Configurable for testing: by default auto_billing is true unless specified
  if (feature === 'auto_billing') {
    return true;
  }
  return true;
}

// =============================================================================
// SUBSCRIPTION CONTRACTS (P2)
// =============================================================================

export type SubscriptionStatus = 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Closed';
export type BillingCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface SubscriptionLineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantExtraPrice: number; // Paise
  quantity: number;
  unitPrice: number;         // Base unit price in Paise
  taxId?: string;
  isTaxInclusive?: boolean;
}

export interface SubscriptionCustomer {
  id: string;
  name: string;
  email: string;
  address?: string;
  taxNumber?: string; // GSTIN
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: BillingCycle;
  priceInPaise: number;
}

export interface SubscriptionContract {
  id: string;
  tenantId: string;
  number: string;
  status: SubscriptionStatus;
  customerId: string;
  customer: SubscriptionCustomer;
  planId: string;
  plan: SubscriptionPlan;
  startDate: Date;
  expiryDate: Date;
  paymentTerms: number; // In days (e.g. 15, 30)
  nextInvoiceDate: Date;
  lines: SubscriptionLineItem[];
}

export interface ApplicableDiscount {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // percentage (e.g. 10 for 10%) or fixed amount in Paise (e.g. 5000 for Rs 50)
  productId?: string; // if product specific
  maxUses: number;
  usesCount: number;
  startDate?: Date;
  endDate?: Date;
}

// In-memory registry for stubbed subscriptions & discounts
export const mockSubscriptions = new Map<string, SubscriptionContract>();
export const mockDiscounts = new Map<string, ApplicableDiscount>();
export const mockAuditEvents: Array<{ subscriptionId: string; type: string; meta: any; createdAt: Date }> = [];

/**
 * P2 getApplicableDiscounts Stub
 */
export async function getApplicableDiscounts(
  subscriptionId: string,
  periodStart: Date
): Promise<ApplicableDiscount[]> {
  const discounts: ApplicableDiscount[] = [];
  for (const discount of mockDiscounts.values()) {
    if (discount.usesCount < discount.maxUses) {
      if (!discount.startDate || discount.startDate <= periodStart) {
        if (!discount.endDate || discount.endDate >= periodStart) {
          discounts.push({ ...discount });
        }
      }
    }
  }
  return discounts;
}

/**
 * P2 consumeDiscount Stub
 */
export async function consumeDiscount(discountId: string, tx?: any): Promise<boolean> {
  const discount = mockDiscounts.get(discountId);
  if (!discount) return false;
  if (discount.usesCount >= discount.maxUses) return false;
  discount.usesCount += 1;
  return true;
}

/**
 * P2 addAuditEvent Stub
 */
export async function addAuditEvent(
  subscriptionId: string,
  type: string,
  meta: any,
  tx?: any
): Promise<void> {
  mockAuditEvents.push({
    subscriptionId,
    type,
    meta,
    createdAt: new Date(),
  });
}

/**
 * P2 advanceNextInvoiceDate Stub
 */
export async function advanceNextInvoiceDate(
  subscriptionId: string,
  tx?: any
): Promise<Date | null> {
  const sub = mockSubscriptions.get(subscriptionId);
  if (!sub) return null;

  const currentNext = new Date(sub.nextInvoiceDate);
  const cycle = sub.plan.billingCycle;

  if (cycle === 'DAILY') {
    currentNext.setDate(currentNext.getDate() + 1);
  } else if (cycle === 'WEEKLY') {
    currentNext.setDate(currentNext.getDate() + 7);
  } else if (cycle === 'MONTHLY') {
    currentNext.setMonth(currentNext.getMonth() + 1);
  } else if (cycle === 'YEARLY') {
    currentNext.setFullYear(currentNext.getFullYear() + 1);
  }

  sub.nextInvoiceDate = currentNext;
  return currentNext;
}

