import { describe, expect, it } from 'vitest';
import {
  InvalidSubscriptionTransitionError,
  resolveSubscriptionTransition,
} from '../subscriptions.state-machine.js';

describe('subscription state machine', () => {
  it('allows the normal quotation-to-active path only when guards pass', () => {
    expect(resolveSubscriptionTransition('DRAFT', 'submitQuotation', {
      role: 'STAFF',
      quotationIsValid: true,
    }).to).toBe('QUOTATION');
    expect(resolveSubscriptionTransition('QUOTATION', 'confirm', {
      role: 'CUSTOMER',
      actorOwnsSubscription: true,
      quotationIsValid: true,
    }).to).toBe('CONFIRMED');
    expect(resolveSubscriptionTransition('CONFIRMED', 'activate', {
      role: 'ADMIN',
      startDateValid: true,
      planAvailable: true,
      minimumQuantityMet: true,
      paymentConfirmed: true,
    }).to).toBe('ACTIVE');
  });

  it('rejects customer confirmation for another customer and expired quotations', () => {
    expect(() => resolveSubscriptionTransition('QUOTATION', 'confirm', {
      role: 'CUSTOMER',
      actorOwnsSubscription: false,
      quotationIsValid: true,
    })).toThrow(InvalidSubscriptionTransitionError);
    expect(() => resolveSubscriptionTransition('QUOTATION', 'confirm', {
      role: 'ADMIN',
      quotationIsValid: false,
    })).toThrow(/guard failed/i);
  });

  it('enforces plan flags for pause, renewal and closure', () => {
    expect(() => resolveSubscriptionTransition('ACTIVE', 'pause', {
      role: 'ADMIN',
      planPausable: false,
    })).toThrow(/guard failed/i);
    expect(resolveSubscriptionTransition('ACTIVE', 'renew', {
      role: 'ADMIN',
      planRenewable: true,
      isExpired: false,
    }).to).toBe('ACTIVE');
    expect(() => resolveSubscriptionTransition('ACTIVE', 'close', {
      role: 'SYSTEM',
      planAutoClose: true,
      isExpired: false,
    })).toThrow(/guard failed/i);
    expect(resolveSubscriptionTransition('PAUSED', 'close', {
      role: 'SYSTEM',
      planAutoClose: true,
      isExpired: true,
    }).to).toBe('CLOSED');
  });

  it('covers every permitted transition row', () => {
    const allowed = [
      ['DRAFT', 'submitQuotation', { role: 'ADMIN', quotationIsValid: true }, 'QUOTATION'],
      ['QUOTATION', 'confirm', { role: 'CUSTOMER', actorOwnsSubscription: true, quotationIsValid: true }, 'CONFIRMED'],
      ['CONFIRMED', 'activate', { role: 'ADMIN', startDateValid: true, planAvailable: true, minimumQuantityMet: true, paymentConfirmed: true }, 'ACTIVE'],
      ['ACTIVE', 'pause', { role: 'ADMIN', planPausable: true, isExpired: false }, 'PAUSED'],
      ['PAUSED', 'resume', { role: 'ADMIN', planAvailable: true, isExpired: false }, 'ACTIVE'],
      ['ACTIVE', 'renew', { role: 'ADMIN', planRenewable: true, isExpired: false }, 'ACTIVE'],
      ['ACTIVE', 'close', { role: 'ADMIN', planClosable: true }, 'CLOSED'],
      ['PAUSED', 'close', { role: 'ADMIN', planClosable: true }, 'CLOSED'],
    ] as const;

    for (const [from, action, context, to] of allowed) {
      expect(resolveSubscriptionTransition(from, action, context).to).toBe(to);
    }
  });

  it('rejects role or guard failures across guarded lifecycle actions', () => {
    const rejected = [
      ['DRAFT', 'submitQuotation', { role: 'CUSTOMER', quotationIsValid: true }],
      ['QUOTATION', 'confirm', { role: 'CUSTOMER', actorOwnsSubscription: true, quotationIsValid: false }],
      ['CONFIRMED', 'activate', { role: 'STAFF', startDateValid: true, planAvailable: true, minimumQuantityMet: true, paymentConfirmed: true }],
      ['CONFIRMED', 'activate', { role: 'ADMIN', startDateValid: true, planAvailable: false, minimumQuantityMet: true, paymentConfirmed: true }],
      ['ACTIVE', 'pause', { role: 'ADMIN', planPausable: false, isExpired: false }],
      ['PAUSED', 'resume', { role: 'ADMIN', planAvailable: false, isExpired: false }],
      ['ACTIVE', 'renew', { role: 'ADMIN', planRenewable: false, isExpired: false }],
      ['ACTIVE', 'close', { role: 'ADMIN', planClosable: false }],
      ['PAUSED', 'close', { role: 'ADMIN', planClosable: false }],
    ] as const;

    for (const [from, action, context] of rejected) {
      expect(() => resolveSubscriptionTransition(from, action, context)).toThrow(InvalidSubscriptionTransitionError);
    }
  });
});
