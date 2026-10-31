import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceService } from '../invoice.service.js';
import { taxService } from '../tax.service.js';
import {
  mockSubscriptions,
  mockDiscounts,
  mockAuditEvents,
  SubscriptionContract,
} from '../contracts.js';
import { clock } from '../clock.service.js';

describe('Invoice Service & Lifecycle', () => {
  const tenantA = 'tenant_loopdesk_a';
  const tenantB = 'tenant_loopdesk_b';

  beforeEach(async () => {
    invoiceService.clearStore();
    taxService.clearStore();
    mockSubscriptions.clear();
    mockDiscounts.clear();
    mockAuditEvents.length = 0;
    clock.setTestDate(new Date('2026-10-01T10:00:00Z'));

    // Seed taxes for tenantA
    await taxService.seedDefaultTaxes(tenantA);
  });

  it('calculates periodEnd for each billing cycle correctly and caps at expiryDate', () => {
    const start = new Date('2026-01-01T00:00:00Z');

    // DAILY: +1 day
    const dailyEnd = invoiceService.calculatePeriodEnd(start, 'DAILY');
    assert.equal(dailyEnd.toISOString().split('T')[0], '2026-01-02');

    // WEEKLY: +7 days
    const weeklyEnd = invoiceService.calculatePeriodEnd(start, 'WEEKLY');
    assert.equal(weeklyEnd.toISOString().split('T')[0], '2026-01-08');

    // MONTHLY: +1 month minus 1 day (Jan 1 -> Jan 31)
    const monthlyEnd = invoiceService.calculatePeriodEnd(start, 'MONTHLY');
    assert.equal(monthlyEnd.toISOString().split('T')[0], '2026-01-31');

    // YEARLY: +1 year minus 1 day (Jan 1 2026 -> Dec 31 2026)
    const yearlyEnd = invoiceService.calculatePeriodEnd(start, 'YEARLY');
    assert.equal(yearlyEnd.toISOString().split('T')[0], '2026-12-31');

    // Expiry date cap
    const earlyExpiry = new Date('2026-01-15T00:00:00Z');
    const cappedEnd = invoiceService.calculatePeriodEnd(start, 'MONTHLY', earlyExpiry);
    assert.equal(cappedEnd.toISOString().split('T')[0], '2026-01-15');
  });

  it('generates an invoice with discounts applied BEFORE tax and advances subscription nextInvoiceDate', async () => {
    const taxes = await taxService.getTaxes(tenantA, {});
    const gst18 = taxes.data.find((t) => t.rate === 18)!;

    const sub: SubscriptionContract = {
      id: 'sub_test_01',
      tenantId: tenantA,
      number: 'SUB-001',
      status: 'Active',
      customerId: 'cust_01',
      customer: {
        id: 'cust_01',
        name: 'Acme Corp',
        email: 'billing@acme.com',
      },
      planId: 'plan_standard',
      plan: {
        id: 'plan_standard',
        name: 'Standard Tier',
        billingCycle: 'MONTHLY',
        priceInPaise: 58000,
      },
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-10-01'),
      paymentTerms: 15,
      nextInvoiceDate: new Date('2026-10-01'),
      lines: [
        {
          id: 'sline_1',
          productId: 'prod_seat',
          productName: 'User Seat',
          quantity: 2,
          unitPrice: 58000, // Rs 580 per seat = 58000 paise
          variantExtraPrice: 0,
          taxId: gst18.id,
          isTaxInclusive: false,
        },
      ],
    };
    mockSubscriptions.set(sub.id, sub);

    // Add a 10% discount
    mockDiscounts.set('disc_10', {
      id: 'disc_10',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      maxUses: 1,
      usesCount: 0,
    });

    const invoice = await invoiceService.generateInvoice(tenantA, {
      subscriptionId: sub.id,
      periodStart: new Date('2026-10-01'),
    });

    // 2 seats * Rs 580 = Rs 1160 (116000 paise)
    // 10% discount = 11600 paise
    // Net = 116000 - 11600 = 104400 paise
    // Tax 18% = round(104400 * 0.18) = 18792 paise
    // Total = 104400 + 18792 = 123192 paise
    assert.equal(invoice.subtotal, 116000);
    assert.equal(invoice.discountTotal, 11600);
    assert.equal(invoice.taxTotal, 18792);
    assert.equal(invoice.total, 123192);
    assert.equal(invoice.balance, 123192);

    // Subscription nextInvoiceDate advanced by 1 month
    assert.equal(
      new Date(sub.nextInvoiceDate).toISOString().split('T')[0],
      '2026-11-01'
    );

    // Audit event recorded
    assert.ok(mockAuditEvents.some((e) => e.type === 'INVOICE_GENERATED'));
  });

  it('enforces UNIQUE (subscriptionId, periodStart, periodEnd) constraint', async () => {
    const sub: SubscriptionContract = {
      id: 'sub_test_02',
      tenantId: tenantA,
      number: 'SUB-002',
      status: 'Active',
      customerId: 'cust_02',
      customer: { id: 'cust_02', name: 'Beta Ltd', email: 'beta@ltd.com' },
      planId: 'plan_free',
      plan: { id: 'plan_free', name: 'Free Tier', billingCycle: 'MONTHLY', priceInPaise: 0 },
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-10-01'),
      paymentTerms: 30,
      nextInvoiceDate: new Date('2026-10-01'),
      lines: [
        {
          id: 'sline_2',
          productId: 'prod_app',
          productName: 'Single App',
          quantity: 1,
          unitPrice: 0,
          variantExtraPrice: 0,
        },
      ],
    };
    mockSubscriptions.set(sub.id, sub);

    // First generation succeeds
    await invoiceService.generateInvoice(tenantA, {
      subscriptionId: sub.id,
      periodStart: new Date('2026-10-01'),
    });

    // Duplicate generation in same period must be rejected with 409
    await assert.rejects(
      async () => {
        await invoiceService.generateInvoice(tenantA, {
          subscriptionId: sub.id,
          periodStart: new Date('2026-10-01'),
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'DUPLICATE_INVOICE_PERIOD');
        return true;
      }
    );
  });

  it('handles invoice lifecycle transitions and immutable confirmed invoices', async () => {
    // 1. Create a manual invoice (starts in DRAFT)
    const draftInvoice = await invoiceService.createManualInvoice(tenantA, {
      subscriptionId: 'sub_manual_1',
      customerId: 'cust_manual_1',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [
        {
          description: 'Consulting slot',
          quantity: 1,
          unitPrice: 100000, // Rs 1,000.00
          discountAmount: 0,
          isTaxInclusive: false,
        },
      ],
    });
    assert.equal(draftInvoice.status, 'DRAFT');

    // 2. PATCH is allowed on DRAFT
    const patched = await invoiceService.patchInvoice(tenantA, draftInvoice.id, {
      notes: 'Updated invoice note for client',
    });
    assert.equal(patched.notes, 'Updated invoice note for client');

    // 3. Confirm DRAFT -> CONFIRMED
    const confirmed = await invoiceService.confirmInvoice(tenantA, draftInvoice.id);
    assert.equal(confirmed.status, 'CONFIRMED');

    // 4. Modifying a CONFIRMED invoice must be rejected
    await assert.rejects(
      async () => {
        await invoiceService.patchInvoice(tenantA, draftInvoice.id, {
          notes: 'Illegal attempt to alter confirmed invoice',
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      }
    );

    // 5. Cancel CONFIRMED with zero payments is allowed
    const cancelled = await invoiceService.cancelInvoice(tenantA, draftInvoice.id);
    assert.equal(cancelled.status, 'CANCELLED');
  });

  it('generates an A4 PDF and queues an EmailOutbox item when sent', async () => {
    const draft = await invoiceService.createManualInvoice(tenantA, {
      subscriptionId: 'sub_pdf_1',
      customerId: 'cust_pdf_1',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [
        {
          description: 'Custom Plan Workspace',
          quantity: 1,
          unitPrice: 108000,
          discountAmount: 0,
          isTaxInclusive: false,
        },
      ],
    });

    const pdfBuffer = await invoiceService.generateInvoicePdf(draft);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 500, 'PDF buffer should be non-empty');
    assert.equal(pdfBuffer.subarray(0, 4).toString(), '%PDF');

    // Send invoice
    const sendResult = await invoiceService.sendInvoice(tenantA, draft.id, 'recipient@example.com');
    assert.equal(sendResult.success, true);
    assert.ok(sendResult.emailOutboxId);

    const updated = await invoiceService.getInvoiceById(tenantA, draft.id);
    assert.ok(updated?.sentAt);
  });

  it('strictly enforces tenant isolation across invoice queries and actions', async () => {
    const invA = await invoiceService.createManualInvoice(tenantA, {
      subscriptionId: 'sub_tenant_a',
      customerId: 'cust_tenant_a',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'Item A', quantity: 1, unitPrice: 5000, discountAmount: 0, isTaxInclusive: false }],
    });

    // Tenant B querying Tenant A's invoice gets 404/null
    const lookupByB = await invoiceService.getInvoiceById(tenantB, invA.id);
    assert.equal(lookupByB, null);

    // Tenant B cannot confirm Tenant A's invoice
    await assert.rejects(
      async () => {
        await invoiceService.confirmInvoice(tenantB, invA.id);
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // List invoices for Tenant B is empty
    const listB = await invoiceService.getInvoices(tenantB, { page: 1, limit: 20 });
    assert.equal(listB.data.length, 0);
  });
});
