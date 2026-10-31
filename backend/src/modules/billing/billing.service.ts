import { clock } from '../../common/clock.js';
import { AppError } from '../../common/errors.js';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  tenantId: string;
  subscriptionId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  amountPaidPaise: number;
  balancePaise: number;
  status: InvoiceStatus;
  lines: Array<{
    description: string;
    quantity: number;
    unitPricePaise: number;
    discountPaise: number;
    taxRate: number;
    taxAmountPaise: number;
    totalPaise: number;
  }>;
  createdAt: Date;
}

export interface TaxRule {
  id: string;
  tenantId: string;
  name: string;
  ratePercent: number;
  isInclusive: boolean;
  createdAt: Date;
}

export interface PaymentItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  amountPaise: number;
  amountInr: number;
  method: string;
  paymentDate: Date;
  note?: string;
}

export interface DunningRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  daysOverdue: number;
  step: number; // 1, 3, 7, 14
  amountDuePaise: number;
  sentAt: Date;
}

export interface BillingRunResult {
  id: string;
  runDate: Date;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  status: 'COMPLETED' | 'FAILED';
}

const invoicesStore: InvoiceItem[] = [];
const taxesStore: TaxRule[] = [];
const paymentsStore: PaymentItem[] = [];
const dunningLogsStore: DunningRecord[] = [];
const billingRunsStore: BillingRunResult[] = [];
let invCounter = 1000;

function seedInitialBilling() {
  if (invoicesStore.length > 0) return;

  const defaultTenant = 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3';
  const now = clock.now();

  // Taxes seed: GST 5, 12, 18
  taxesStore.push(
    { id: 'tax-gst-18', tenantId: defaultTenant, name: 'GST 18% (Standard)', ratePercent: 18, isInclusive: false, createdAt: now },
    { id: 'tax-gst-12', tenantId: defaultTenant, name: 'GST 12% (Services)', ratePercent: 12, isInclusive: false, createdAt: now },
    { id: 'tax-gst-5', tenantId: defaultTenant, name: 'GST 5% (Reduced)', ratePercent: 5, isInclusive: false, createdAt: now }
  );

  // Invoice 1: Paid invoice
  const inv1Id = 'inv-seed-001';
  invoicesStore.push({
    id: inv1Id,
    tenantId: defaultTenant,
    subscriptionId: 'sub-seed-001',
    invoiceNumber: 'INV-2026-1001',
    customerName: 'NexGen Cloud Services',
    customerEmail: 'billing@nexgen.io',
    periodStart: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    subtotalPaise: 555900,
    discountPaise: 0,
    taxPaise: 100062,
    totalPaise: 655962, // Rs 6,559.62
    amountPaidPaise: 655962,
    balancePaise: 0,
    status: 'PAID',
    lines: [
      {
        description: 'LoopDesk Enterprise Suite (Brand Odoo Integration)',
        quantity: 1,
        unitPricePaise: 555900,
        discountPaise: 0,
        taxRate: 18,
        taxAmountPaise: 100062,
        totalPaise: 655962
      }
    ],
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
  });

  paymentsStore.push({
    id: 'pay-seed-001',
    tenantId: defaultTenant,
    invoiceId: inv1Id,
    amountPaise: 655962,
    amountInr: 6559.62,
    method: 'UPI',
    paymentDate: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000),
    note: 'Instant settlement via UPI QR'
  });

  // Invoice 2: Overdue invoice for Autopilot Dunning demonstration (14 days overdue)
  const overdueId = 'inv-seed-002';
  invoicesStore.push({
    id: overdueId,
    tenantId: defaultTenant,
    subscriptionId: 'sub-seed-001',
    invoiceNumber: 'INV-2026-1002',
    customerName: 'Aether Logistics India',
    customerEmail: 'accounts@aetherlogistics.com',
    periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(now.getTime()),
    dueDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // Due 14 days ago
    subtotalPaise: 499900,
    discountPaise: 0,
    taxPaise: 89982,
    totalPaise: 589882, // Rs 5,898.82
    amountPaidPaise: 0,
    balancePaise: 589882,
    status: 'CONFIRMED', // Confirmed but unpaid
    lines: [
      {
        description: 'LoopDesk Core Suite - Monthly License',
        quantity: 1,
        unitPricePaise: 499900,
        discountPaise: 0,
        taxRate: 18,
        taxAmountPaise: 89982,
        totalPaise: 589882
      }
    ],
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  });

  // Pre-seed Autopilot Dunning logs (Day 1, 3, 7, 14 reminders)
  [1, 3, 7, 14].forEach((step) => {
    dunningLogsStore.push({
      id: `dun-${overdueId}-${step}`,
      invoiceId: overdueId,
      invoiceNumber: 'INV-2026-1002',
      customerName: 'Aether Logistics India',
      daysOverdue: step,
      step,
      amountDuePaise: 589882,
      sentAt: new Date(now.getTime() - (14 - step) * 24 * 60 * 60 * 1000)
    });
  });
}

seedInitialBilling();

export class BillingService {
  constructor() {
    seedInitialBilling();
  }

  public listInvoices(tenantId: string) {
    seedInitialBilling();
    return invoicesStore.filter((i) => i.tenantId === tenantId || i.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3' || tenantId === 'tenant_default');
  }

  public getInvoice(id: string, tenantId: string) {
    const inv = invoicesStore.find((i) => i.id === id);
    if (!inv) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
    return inv;
  }

  public generateSingleInvoice(tenantId: string, subscriptionId: string, periodStartStr?: string) {
    seedInitialBilling();
    invCounter++;
    const now = clock.now();
    const periodStart = periodStartStr ? new Date(periodStartStr) : now;
    const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const newInvoice: InvoiceItem = {
      id: `inv-${Date.now()}`,
      tenantId,
      subscriptionId,
      invoiceNumber: `INV-2026-${invCounter}`,
      customerName: 'Enterprise Client',
      customerEmail: 'billing@client.com',
      periodStart,
      periodEnd,
      dueDate,
      subtotalPaise: 499900,
      discountPaise: 0,
      taxPaise: 89982,
      totalPaise: 589882,
      amountPaidPaise: 0,
      balancePaise: 589882,
      status: 'CONFIRMED',
      lines: [
        {
          description: 'LoopDesk Monthly Subscription',
          quantity: 1,
          unitPricePaise: 499900,
          discountPaise: 0,
          taxRate: 18,
          taxAmountPaise: 89982,
          totalPaise: 589882
        }
      ],
      createdAt: now
    };

    invoicesStore.unshift(newInvoice);
    return newInvoice;
  }

  public confirmInvoice(id: string, tenantId: string) {
    const inv = invoicesStore.find((i) => i.id === id);
    if (!inv) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
    inv.status = 'CONFIRMED';
    return inv;
  }

  public cancelInvoice(id: string, tenantId: string) {
    const inv = invoicesStore.find((i) => i.id === id);
    if (!inv) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
    if (inv.status === 'PAID') {
      throw new AppError(400, 'INVALID_STATE', 'Paid invoices cannot be cancelled');
    }
    inv.status = 'CANCELLED';
    return inv;
  }

  // Record payment against invoice
  public recordPayment(id: string, amountPaise: number, method: string, note?: string) {
    const inv = invoicesStore.find((i) => i.id === id);
    if (!inv) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
    if (inv.status === 'CANCELLED') {
      throw new AppError(400, 'INVALID_STATE', 'Cannot record payment on cancelled invoice');
    }

    inv.amountPaidPaise += amountPaise;
    inv.balancePaise = Math.max(0, inv.totalPaise - inv.amountPaidPaise);

    // Rule: Paid if and only if balance is 0
    if (inv.balancePaise === 0) {
      inv.status = 'PAID';
    }

    const payment: PaymentItem = {
      id: `pay-${Date.now()}`,
      tenantId: inv.tenantId,
      invoiceId: inv.id,
      amountPaise,
      amountInr: amountPaise / 100,
      method: method || 'UPI',
      paymentDate: clock.now(),
      note: note || 'Direct payment clearance'
    };
    paymentsStore.unshift(payment);

    return {
      success: true,
      invoice: inv,
      payment
    };
  }

  // Taxes
  public listTaxes(tenantId: string) {
    seedInitialBilling();
    return taxesStore;
  }

  public createTax(tenantId: string, data: any) {
    const tax: TaxRule = {
      id: `tax-${Date.now()}`,
      tenantId,
      name: data.name,
      ratePercent: Number(data.ratePercent) || 18,
      isInclusive: Boolean(data.isInclusive),
      createdAt: clock.now()
    };
    taxesStore.push(tax);
    return tax;
  }

  // Payments
  public listPayments(tenantId: string) {
    seedInitialBilling();
    return paymentsStore;
  }

  public getPaymentsForInvoice(invoiceId: string) {
    return paymentsStore.filter((p) => p.invoiceId === invoiceId);
  }

  // Billing Day Control Room Run Engine (Unique Feature #3)
  public runBillingEngine(tenantId: string, subscriptions: any[]) {
    seedInitialBilling();
    const now = clock.now();
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      if (sub.status !== 'ACTIVE') continue;

      const periodStart = sub.startDate;
      const periodEnd = sub.nextInvoiceDate;

      const exists = invoicesStore.some(
        (i) => i.subscriptionId === sub.id &&
               new Date(i.periodStart).toDateString() === new Date(periodStart).toDateString()
      );

      if (exists) {
        skipped++;
      } else {
        invCounter++;
        const newInvNumber = `INV-2026-${invCounter}`;
        invoicesStore.unshift({
          id: `inv-${Date.now()}-${sub.id}`,
          tenantId,
          subscriptionId: sub.id,
          invoiceNumber: newInvNumber,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          periodStart,
          periodEnd,
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          subtotalPaise: sub.subtotalPaise || 499900,
          discountPaise: sub.discountPaise || 0,
          taxPaise: sub.taxPaise || 89982,
          totalPaise: sub.totalPaise || 589882,
          amountPaidPaise: 0,
          balancePaise: sub.totalPaise || 589882,
          status: 'CONFIRMED',
          lines: sub.lines.map((l: any) => ({
            description: `${l.productName} ${l.variantName ? `(${l.variantName})` : ''}`,
            quantity: l.quantity,
            unitPricePaise: l.unitPricePaise,
            discountPaise: 0,
            taxRate: 18,
            taxAmountPaise: Math.round((l.amountPaise * 18) / 100),
            totalPaise: l.amountPaise + Math.round((l.amountPaise * 18) / 100)
          })),
          createdAt: now
        });
        created++;
      }
    }

    const runResult: BillingRunResult = {
      id: `run-${Date.now()}`,
      runDate: now,
      totalProcessed: created + skipped + failed,
      createdCount: created,
      skippedCount: skipped,
      failedCount: failed,
      status: 'COMPLETED'
    };

    billingRunsStore.unshift(runResult);
    return runResult;
  }

  public getBillingRunHistory(tenantId: string) {
    return billingRunsStore;
  }

  // Autopilot Dunning & Overdue Board (Unique Feature #5)
  public getOverdueBoard(tenantId: string) {
    seedInitialBilling();
    const now = clock.now();
    const overdueInvoices = invoicesStore.filter(
      (i) => i.status === 'CONFIRMED' && new Date(i.dueDate) < now && i.balancePaise > 0
    );

    const revenueAtRiskPaise = overdueInvoices.reduce((acc, i) => acc + i.balancePaise, 0);

    return {
      revenueAtRiskPaise,
      revenueAtRiskInr: revenueAtRiskPaise / 100,
      overdueCount: overdueInvoices.length,
      invoices: overdueInvoices,
      dunningLogs: dunningLogsStore
    };
  }

  // Summary endpoint for Person 4 Revenue Intelligence Dashboard
  public getBillingSummary(tenantId: string) {
    seedInitialBilling();
    const all = invoicesStore.filter((i) => i.tenantId === tenantId || i.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3' || tenantId === 'tenant_default');
    const now = clock.now();

    const invoicedPaise = all.reduce((sum, i) => sum + i.totalPaise, 0);
    const collectedPaise = all.reduce((sum, i) => sum + i.amountPaidPaise, 0);
    const outstandingPaise = all.filter((i) => i.status !== 'CANCELLED').reduce((sum, i) => sum + i.balancePaise, 0);
    const overduePaise = all.filter((i) => i.status === 'CONFIRMED' && new Date(i.dueDate) < now && i.balancePaise > 0).reduce((sum, i) => sum + i.balancePaise, 0);

    return {
      invoicedPaise,
      invoicedInr: invoicedPaise / 100,
      collectedPaise,
      collectedInr: collectedPaise / 100,
      outstandingPaise,
      outstandingInr: outstandingPaise / 100,
      overduePaise,
      overdueInr: overduePaise / 100,
      paidInvoicesCount: all.filter((i) => i.status === 'PAID').length,
      confirmedInvoicesCount: all.filter((i) => i.status === 'CONFIRMED').length,
      totalInvoicesCount: all.length
    };
  }
}
