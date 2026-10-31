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
});
