import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { paymentService } from '../payment.service.js';
import { invoiceService } from '../../billing/invoice.service.js';
import { taxService } from '../../billing/tax.service.js';
import { mockSubscriptions, mockDiscounts, mockAuditEvents } from '../../billing/contracts.js';
import { clock } from '../../billing/clock.service.js';

describe('Payment Engine & Settlement', () => {
  const tenantId = 'tenant_payments_test';

  beforeEach(async () => {
    paymentService.clearStore();
    invoiceService.clearStore();
    taxService.clearStore();
    mockSubscriptions.clear();
    mockDiscounts.clear();
    mockAuditEvents.length = 0;
    clock.setTestDate(new Date('2026-10-01T10:00:00Z'));

    await taxService.seedDefaultTaxes(tenantId);
  });

  it('rejects payment on a DRAFT invoice', async () => {
    const draft = await invoiceService.createManualInvoice(tenantId, {
      subscriptionId: 'sub_pay_1',
      customerId: 'cust_pay_1',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'Test Item', quantity: 1, unitPrice: 50000 }],
    });
    assert.equal(draft.status, 'DRAFT');

    await assert.rejects(
      async () => {
        await paymentService.recordPayment(tenantId, draft.id, {
          method: 'UPI',
          amount: 50000,
          paidOn: new Date(),
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      }
    );
  });

  it('records partial payment then final payment, recomputing from payments table to reach PAID', async () => {
    // Create and confirm invoice: Total Rs 1000.00 (100,000 paise)
    const draft = await invoiceService.createManualInvoice(tenantId, {
      subscriptionId: 'sub_pay_2',
      customerId: 'cust_pay_2',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'Software Plan', quantity: 1, unitPrice: 100000 }],
    });
    const confirmed = await invoiceService.confirmInvoice(tenantId, draft.id);
    assert.equal(confirmed.status, 'CONFIRMED');
    assert.equal(confirmed.total, 100000);
    assert.equal(confirmed.balance, 100000);

    // 1. Partial payment: Rs 400.00 (40,000 paise)
    const part1 = await paymentService.recordPayment(tenantId, confirmed.id, {
      method: 'CARD',
      amount: 40000,
      paidOn: new Date(),
      reference: 'TXN-CARD-001',
    });

    assert.equal(part1.invoice.amountPaid, 40000);
    assert.equal(part1.invoice.balance, 60000);
    assert.equal(part1.invoice.status, 'CONFIRMED'); // Still CONFIRMED since balance > 0

    // 2. Final payment: Remaining Rs 600.00 (60,000 paise)
    const part2 = await paymentService.recordPayment(tenantId, confirmed.id, {
      method: 'UPI',
      amount: 60000,
      paidOn: new Date(),
      reference: 'TXN-UPI-002',
    });

    assert.equal(part2.invoice.amountPaid, 100000);
    assert.equal(part2.invoice.balance, 0);
    assert.equal(part2.invoice.status, 'PAID'); // Automatically transitioned to PAID

    // Check payment history
    const history = await paymentService.getPaymentsByInvoiceId(tenantId, confirmed.id);
    assert.equal(history.length, 2);
    assert.equal(history[0].amount + history[1].amount, 100000);

    // Audit events emitted
    assert.ok(mockAuditEvents.some((e) => e.type === 'PAYMENT_RECORDED'));
  });

  it('strictly rejects overpayment when amount exceeds invoice balance', async () => {
    const draft = await invoiceService.createManualInvoice(tenantId, {
      subscriptionId: 'sub_pay_3',
      customerId: 'cust_pay_3',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'Seat License', quantity: 1, unitPrice: 58000 }],
    });
    const confirmed = await invoiceService.confirmInvoice(tenantId, draft.id);
    assert.equal(confirmed.balance, 58000);

    // Attempt to pay 60,000 paise on 58,000 balance
    await assert.rejects(
      async () => {
        await paymentService.recordPayment(tenantId, confirmed.id, {
          method: 'BANK_TRANSFER',
          amount: 60000,
          paidOn: new Date(),
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'OVERPAYMENT_NOT_ALLOWED');
        return true;
      }
    );
  });

  it('rejects cancellation of an invoice with recorded payments', async () => {
    const draft = await invoiceService.createManualInvoice(tenantId, {
      subscriptionId: 'sub_pay_4',
      customerId: 'cust_pay_4',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'Add-on module', quantity: 1, unitPrice: 30000 }],
    });
    const confirmed = await invoiceService.confirmInvoice(tenantId, draft.id);

    // Record partial payment
    await paymentService.recordPayment(tenantId, confirmed.id, {
      method: 'CASH',
      amount: 10000,
      paidOn: new Date(),
    });

    // Attempting to cancel must be rejected because amountPaid > 0
    await assert.rejects(
      async () => {
        await invoiceService.cancelInvoice(tenantId, confirmed.id);
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'INVALID_TRANSITION');
        return true;
      }
    );
  });

  it('rejects payment on an already settled PAID invoice', async () => {
    const draft = await invoiceService.createManualInvoice(tenantId, {
      subscriptionId: 'sub_pay_5',
      customerId: 'cust_pay_5',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      lines: [{ description: 'One-off setup', quantity: 1, unitPrice: 20000 }],
    });
    const confirmed = await invoiceService.confirmInvoice(tenantId, draft.id);

    // Settle fully
    await paymentService.recordPayment(tenantId, confirmed.id, {
      method: 'CHEQUE',
      amount: 20000,
      paidOn: new Date(),
    });

    // Additional payment attempt must be rejected
    await assert.rejects(
      async () => {
        await paymentService.recordPayment(tenantId, confirmed.id, {
          method: 'CASH',
          amount: 100,
          paidOn: new Date(),
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.code, 'INVOICE_ALREADY_PAID');
        return true;
      }
    );
  });
});
