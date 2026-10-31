import PDFDocument from 'pdfkit';
import { clock } from './clock.service.js';
import {
  can,
  mockSubscriptions,
  getApplicableDiscounts,
  consumeDiscount,
  addAuditEvent,
  advanceNextInvoiceDate,
  SubscriptionContract,
  BillingCycle,
} from './contracts.js';
import { taxService } from './tax.service.js';
import {
  GenerateInvoiceInput,
  ManualCreateInvoiceInput,
  PatchInvoiceInput,
  QueryInvoicesInput,
} from './invoice.schema.js';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceLineModel {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;        // In Paise (base + variant extra)
  discountAmount: number;   // In Paise
  netAmount: number;        // In Paise
  taxId?: string;
  taxRate: number;          // e.g. 18.00
  taxAmount: number;        // In Paise (half-up rounded)
  grossAmount: number;      // In Paise (netAmount + taxAmount)
  isTaxInclusive: boolean;
  productId?: string;
  variantId?: string;
}

export interface InvoiceModel {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
  subtotal: number;       // Paise
  discountTotal: number;  // Paise
  taxTotal: number;       // Paise
  total: number;          // Paise
  amountPaid: number;     // Paise
  balance: number;        // Paise
  notes?: string;
  terms?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lines: InvoiceLineModel[];
  isOverdue?: boolean;    // Derived, never stored
}

export interface EmailOutboxModel {
  id: string;
  tenantId: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachmentName?: string;
  attachmentData?: Buffer;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory data store for invoices and counters
const invoiceDatabase = new Map<string, InvoiceModel>();
const invoiceCounters = new Map<string, number>(); // key: `${tenantId}:${prefix}:${year}`
export const emailOutboxDatabase = new Map<string, EmailOutboxModel>();

export class InvoiceService {
  /**
   * Generates a unique, human-readable invoice number per tenant
   * Format: INV-YYYY-XXXXX (e.g. INV-2026-00001)
   */
  public getNextInvoiceNumber(tenantId: string, issueDate: Date, prefix = 'INV'): string {
    const year = issueDate.getFullYear();
    const counterKey = `${tenantId}:${prefix}:${year}`;
    const current = invoiceCounters.get(counterKey) || 0;
    const next = current + 1;
    invoiceCounters.set(counterKey, next);
    const padded = String(next).padStart(5, '0');
    return `${prefix}-${year}-${padded}`;
  }

  /**
   * Calculates the end of the billing period according to plan cycle:
   * DAILY: +1 day
   * WEEKLY: +7 days
   * MONTHLY: +1 month minus 1 day
   * YEARLY: +1 year minus 1 day
   * Never past subscription expiryDate.
   */
  public calculatePeriodEnd(periodStart: Date, cycle: BillingCycle, expiryDate?: Date): Date {
    const start = new Date(periodStart);
    const end = new Date(start);

    switch (cycle) {
      case 'DAILY':
        end.setDate(end.getDate() + 1);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 7);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'YEARLY':
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
    }

    // End of day time
    end.setHours(23, 59, 59, 999);

    if (expiryDate && end > expiryDate) {
      return new Date(expiryDate);
    }
    return end;
  }

  /**
   * Derives whether an invoice is overdue:
   * clock.now() > dueDate && balance > 0 && status === 'CONFIRMED'
   */
  public isInvoiceOverdue(invoice: InvoiceModel, currentDate = clock.now()): boolean {
    return (
      invoice.status === 'CONFIRMED' &&
      invoice.balance > 0 &&
      currentDate.getTime() > new Date(invoice.dueDate).getTime()
    );
  }

  /**
   * Generate an automated invoice from a subscription
   */
  public async generateInvoice(
    tenantId: string,
    input: GenerateInvoiceInput,
    tx?: any
  ): Promise<InvoiceModel> {
    const subscription = mockSubscriptions.get(input.subscriptionId);
    if (!subscription || subscription.tenantId !== tenantId) {
      const error: any = new Error(`Subscription ${input.subscriptionId} not found`);
      error.statusCode = 404;
      error.code = 'SUBSCRIPTION_NOT_FOUND';
      throw error;
    }

    const periodStart = new Date(input.periodStart);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = this.calculatePeriodEnd(
      periodStart,
      subscription.plan.billingCycle,
      subscription.expiryDate
    );

    // Enforce UNIQUE (subscriptionId, periodStart, periodEnd)
    const existing = Array.from(invoiceDatabase.values()).find(
      (inv) =>
        inv.subscriptionId === subscription.id &&
        new Date(inv.periodStart).getTime() === periodStart.getTime() &&
        new Date(inv.periodEnd).getTime() === periodEnd.getTime()
    );

    if (existing) {
      const error: any = new Error(
        `Invoice already exists for subscription ${subscription.id} in period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`
      );
      error.statusCode = 409;
      error.code = 'DUPLICATE_INVOICE_PERIOD';
      throw error;
    }

    const issueDate = clock.now();
    const dueDate = new Date(issueDate.getTime() + (subscription.paymentTerms || 30) * 24 * 60 * 60 * 1000);
    const invoiceNumber = this.getNextInvoiceNumber(tenantId, issueDate);
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Fetch applicable discounts
    const discounts = await getApplicableDiscounts(subscription.id, periodStart);

    // 2. Build invoice lines with discounts and tax
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let total = 0;

    const lines: InvoiceLineModel[] = [];

    for (let i = 0; i < subscription.lines.length; i++) {
      const subLine = subscription.lines[i];
      const lineId = `line_${invoiceId}_${i + 1}`;
      const unitPrice = subLine.unitPrice + (subLine.variantExtraPrice || 0);
      const lineBase = subLine.quantity * unitPrice;

      // Check applicable discount for this line or subscription
      let lineDiscount = 0;
      for (const disc of discounts) {
        if (!disc.productId || disc.productId === subLine.productId) {
          if (disc.usesCount < disc.maxUses) {
            if (disc.type === 'PERCENTAGE') {
              lineDiscount += Math.round((lineBase * disc.value) / 100);
            } else if (disc.type === 'FIXED') {
              lineDiscount += Math.min(lineBase, disc.value);
            }
            await consumeDiscount(disc.id, tx);
          }
        }
      }
      lineDiscount = Math.min(lineBase, lineDiscount);

      // Fetch tax rule
      let taxRule = null;
      if (subLine.taxId) {
        taxRule = await taxService.getTaxById(tenantId, subLine.taxId);
      }

      const calc = taxService.calculateLine(
        {
          quantity: subLine.quantity,
          unitPrice,
          discountAmount: lineDiscount,
          isTaxInclusive: subLine.isTaxInclusive ?? taxRule?.isInclusive ?? false,
        },
        taxRule ? { rate: taxRule.rate, isInclusive: taxRule.isInclusive } : null
      );

      subtotal += lineBase;
      discountTotal += lineDiscount;
      taxTotal += calc.taxAmount;
      total += calc.gross;

      lines.push({
        id: lineId,
        invoiceId,
        description: subLine.productName || `Subscription Product`,
        quantity: subLine.quantity,
        unitPrice,
        discountAmount: lineDiscount,
        netAmount: calc.net,
        taxId: taxRule?.id,
        taxRate: taxRule?.rate || 0,
        taxAmount: calc.taxAmount,
        grossAmount: calc.gross,
        isTaxInclusive: subLine.isTaxInclusive ?? taxRule?.isInclusive ?? false,
        productId: subLine.productId,
        variantId: subLine.variantId,
      });
    }

    // 3. Determine status: DRAFT, or CONFIRMED if auto_billing enabled
    const autoBilling = await can(tenantId, 'auto_billing');
    const status: InvoiceStatus = autoBilling ? 'CONFIRMED' : 'DRAFT';

    const invoice: InvoiceModel = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      customerName: subscription.customer.name,
      customerEmail: subscription.customer.email,
      status,
      issueDate,
      dueDate,
      periodStart,
      periodEnd,
      currency: 'INR',
      subtotal,
      discountTotal,
      taxTotal,
      total,
      amountPaid: 0,
      balance: total,
      notes: `Subscription billing for ${subscription.plan.name}`,
      terms: `Payment due within ${subscription.paymentTerms || 30} days of issue.`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lines,
    };

    invoiceDatabase.set(invoiceId, invoice);

    // 4. Advance next invoice date and record audit event
    await advanceNextInvoiceDate(subscription.id, tx);
    await addAuditEvent(
      subscription.id,
      'INVOICE_GENERATED',
      {
        invoiceId,
        invoiceNumber,
        total,
        status,
        periodStart,
        periodEnd,
      },
      tx
    );

    return {
      ...invoice,
      isOverdue: this.isInvoiceOverdue(invoice),
    };
  }

  /**
   * Manual Invoice Creation (Draft only, obeys unique period key)
   */
  public async createManualInvoice(
    tenantId: string,
    input: ManualCreateInvoiceInput
  ): Promise<InvoiceModel> {
    const periodStart = new Date(input.periodStart);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(input.periodEnd);
    periodEnd.setHours(23, 59, 59, 999);

    // Unique constraint: (subscriptionId, periodStart, periodEnd)
    const existing = Array.from(invoiceDatabase.values()).find(
      (inv) =>
        inv.subscriptionId === input.subscriptionId &&
        new Date(inv.periodStart).getTime() === periodStart.getTime() &&
        new Date(inv.periodEnd).getTime() === periodEnd.getTime()
    );

    if (existing) {
      const error: any = new Error(
        `An invoice already exists for this subscription and period.`
      );
      error.statusCode = 409;
      error.code = 'DUPLICATE_INVOICE_PERIOD';
      throw error;
    }

    const issueDate = clock.now();
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const invoiceNumber = this.getNextInvoiceNumber(tenantId, issueDate);
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let total = 0;

    const lines: InvoiceLineModel[] = [];

    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i];
      const lineId = `line_${invoiceId}_${i + 1}`;
      const lineBase = l.quantity * l.unitPrice;
      const discount = Math.min(lineBase, l.discountAmount || 0);

      let taxRule = null;
      if (l.taxId) {
        taxRule = await taxService.getTaxById(tenantId, l.taxId);
      }

      const calc = taxService.calculateLine(
        {
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: discount,
          isTaxInclusive: l.isTaxInclusive,
        },
        taxRule ? { rate: taxRule.rate, isInclusive: taxRule.isInclusive } : null
      );

      subtotal += lineBase;
      discountTotal += discount;
      taxTotal += calc.taxAmount;
      total += calc.gross;

      lines.push({
        id: lineId,
        invoiceId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountAmount: discount,
        netAmount: calc.net,
        taxId: taxRule?.id,
        taxRate: taxRule?.rate || 0,
        taxAmount: calc.taxAmount,
        grossAmount: calc.gross,
        isTaxInclusive: l.isTaxInclusive,
        productId: l.productId,
        variantId: l.variantId,
      });
    }

    const subscription = mockSubscriptions.get(input.subscriptionId);

    const invoice: InvoiceModel = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      subscriptionId: input.subscriptionId,
      customerId: input.customerId,
      customerName: subscription?.customer.name || 'Valued Customer',
      customerEmail: subscription?.customer.email || 'customer@loopdesk.io',
      status: 'DRAFT', // Manual invoices always start as DRAFT
      issueDate,
      dueDate,
      periodStart,
      periodEnd,
      currency: 'INR',
      subtotal,
      discountTotal,
      taxTotal,
      total,
      amountPaid: 0,
      balance: total,
      notes: input.notes,
      terms: input.terms || 'Payment due within 30 days.',
      createdAt: new Date(),
      updatedAt: new Date(),
      lines,
    };

    invoiceDatabase.set(invoiceId, invoice);
    return {
      ...invoice,
      isOverdue: this.isInvoiceOverdue(invoice),
    };
  }

  /**
   * Confirm an invoice (only allowed from DRAFT)
   * A CONFIRMED invoice becomes immutable!
   */
  public async confirmInvoice(tenantId: string, invoiceId: string): Promise<InvoiceModel> {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      const error: any = new Error(`Invoice ${invoiceId} not found`);
      error.statusCode = 404;
      error.code = 'INVOICE_NOT_FOUND';
      throw error;
    }

    if (invoice.status !== 'DRAFT') {
      const error: any = new Error(
        `Cannot confirm invoice in status ${invoice.status}. Only DRAFT invoices can be confirmed.`
      );
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    invoice.status = 'CONFIRMED';
    invoice.updatedAt = new Date();
    invoiceDatabase.set(invoiceId, invoice);

    await addAuditEvent(invoice.subscriptionId, 'INVOICE_CONFIRMED', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
    });

    return {
      ...invoice,
      isOverdue: this.isInvoiceOverdue(invoice),
    };
  }

  /**
   * Cancel an invoice:
   * Allowed from DRAFT, or from CONFIRMED only if amountPaid === 0.
   */
  public async cancelInvoice(tenantId: string, invoiceId: string): Promise<InvoiceModel> {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      const error: any = new Error(`Invoice ${invoiceId} not found`);
      error.statusCode = 404;
      error.code = 'INVOICE_NOT_FOUND';
      throw error;
    }

    if (invoice.status === 'PAID') {
      const error: any = new Error(`Cannot cancel a PAID invoice.`);
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    if (invoice.status === 'CANCELLED') {
      return {
        ...invoice,
        isOverdue: false,
      };
    }

    if (invoice.status === 'CONFIRMED' && invoice.amountPaid > 0) {
      const error: any = new Error(
        `Cannot cancel invoice with recorded payments (${invoice.amountPaid} paise). Refund or reverse payments first.`
      );
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    invoice.status = 'CANCELLED';
    invoice.updatedAt = new Date();
    invoiceDatabase.set(invoiceId, invoice);

    await addAuditEvent(invoice.subscriptionId, 'INVOICE_CANCELLED', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
    });

    return {
      ...invoice,
      isOverdue: false,
    };
  }

  /**
   * Patch invoice (only allowed in DRAFT status)
   * Confirmed invoices are completely immutable.
   */
  public async patchInvoice(
    tenantId: string,
    invoiceId: string,
    input: PatchInvoiceInput
  ): Promise<InvoiceModel> {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      const error: any = new Error(`Invoice ${invoiceId} not found`);
      error.statusCode = 404;
      error.code = 'INVOICE_NOT_FOUND';
      throw error;
    }

    if (invoice.status !== 'DRAFT') {
      const error: any = new Error(
        `Cannot modify invoice in status ${invoice.status}. Confirmed or settled invoices are immutable.`
      );
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    if (input.notes !== undefined) invoice.notes = input.notes;
    if (input.terms !== undefined) invoice.terms = input.terms;
    if (input.dueDate !== undefined) invoice.dueDate = new Date(input.dueDate);

    if (input.lines && input.lines.length > 0) {
      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;
      let total = 0;

      const newLines: InvoiceLineModel[] = [];

      for (let i = 0; i < input.lines.length; i++) {
        const l = input.lines[i];
        const lineId = `line_${invoiceId}_${i + 1}`;
        const lineBase = l.quantity * l.unitPrice;
        const discount = Math.min(lineBase, l.discountAmount || 0);

        let taxRule = null;
        if (l.taxId) {
          taxRule = await taxService.getTaxById(tenantId, l.taxId);
        }

        const calc = taxService.calculateLine(
          {
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountAmount: discount,
            isTaxInclusive: l.isTaxInclusive,
          },
          taxRule ? { rate: taxRule.rate, isInclusive: taxRule.isInclusive } : null
        );

        subtotal += lineBase;
        discountTotal += discount;
        taxTotal += calc.taxAmount;
        total += calc.gross;

        newLines.push({
          id: lineId,
          invoiceId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: discount,
          netAmount: calc.net,
          taxId: taxRule?.id,
          taxRate: taxRule?.rate || 0,
          taxAmount: calc.taxAmount,
          grossAmount: calc.gross,
          isTaxInclusive: l.isTaxInclusive,
          productId: l.productId,
          variantId: l.variantId,
        });
      }

      invoice.lines = newLines;
      invoice.subtotal = subtotal;
      invoice.discountTotal = discountTotal;
      invoice.taxTotal = taxTotal;
      invoice.total = total;
      invoice.balance = total - invoice.amountPaid;
    }

    invoice.updatedAt = new Date();
    invoiceDatabase.set(invoiceId, invoice);

    return {
      ...invoice,
      isOverdue: this.isInvoiceOverdue(invoice),
    };
  }

  /**
   * Get invoice by ID
   */
  public async getInvoiceById(tenantId: string, invoiceId: string): Promise<InvoiceModel | null> {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      return null;
    }
    return {
      ...invoice,
      isOverdue: this.isInvoiceOverdue(invoice),
    };
  }

  /**
   * Query invoices with filters, search, and pagination (<2s response)
   */
  public async getInvoices(
    tenantId: string,
    query: QueryInvoicesInput
  ): Promise<{ data: InvoiceModel[]; total: number; page: number; limit: number; totalPages: number }> {
    const now = clock.now();
    let invoices = Array.from(invoiceDatabase.values()).filter((inv) => inv.tenantId === tenantId);

    if (query.status) {
      invoices = invoices.filter((inv) => inv.status === query.status);
    }

    if (query.customerId) {
      invoices = invoices.filter((inv) => inv.customerId === query.customerId);
    }

    if (query.subscriptionId) {
      invoices = invoices.filter((inv) => inv.subscriptionId === query.subscriptionId);
    }

    if (query.startDate) {
      const s = new Date(query.startDate).getTime();
      invoices = invoices.filter((inv) => new Date(inv.issueDate).getTime() >= s);
    }

    if (query.endDate) {
      const e = new Date(query.endDate).getTime();
      invoices = invoices.filter((inv) => new Date(inv.issueDate).getTime() <= e);
    }

    if (query.overdue !== undefined) {
      invoices = invoices.filter((inv) => this.isInvoiceOverdue(inv, now) === query.overdue);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(s) ||
          inv.customerName.toLowerCase().includes(s) ||
          inv.customerEmail.toLowerCase().includes(s)
      );
    }

    // Sort by issueDate desc
    invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    const total = invoices.length;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const start = (page - 1) * limit;
    const data = invoices.slice(start, start + limit).map((inv) => ({
      ...inv,
      isOverdue: this.isInvoiceOverdue(inv, now),
    }));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Generate A4 PDF buffer for an invoice
   */
  public async generateInvoicePdf(invoice: InvoiceModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header / Brand
      doc.fillColor('#6C4BFF').fontSize(24).text('LoopDesk', 40, 40);
      doc.fillColor('#1B1F3B').fontSize(10).text('LoopDesk B2B Subscription Billing', 40, 70);
      doc.text(`Tenant ID: ${invoice.tenantId}`, 40, 85);

      // Invoice Details (Right Side)
      doc.fontSize(18).fillColor('#1B1F3B').text('INVOICE', 380, 40, { align: 'right' });
      doc.fontSize(10).text(`Number: ${invoice.invoiceNumber}`, 380, 65, { align: 'right' });
      doc.text(`Status: ${invoice.status}`, 380, 80, { align: 'right' });
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toISOString().split('T')[0]}`, 380, 95, { align: 'right' });
      doc.text(`Due Date: ${new Date(invoice.dueDate).toISOString().split('T')[0]}`, 380, 110, { align: 'right' });

      doc.moveTo(40, 135).lineTo(555, 135).strokeColor('#E0E0E0').stroke();

      // Billed To & Period
      doc.fontSize(11).fillColor('#6C4BFF').text('Billed To:', 40, 150);
      doc.fontSize(10).fillColor('#1B1F3B').text(invoice.customerName, 40, 168);
      doc.text(invoice.customerEmail, 40, 183);
      doc.text(`Customer ID: ${invoice.customerId}`, 40, 198);

      doc.fontSize(11).fillColor('#6C4BFF').text('Billing Period:', 300, 150);
      doc.fontSize(10).fillColor('#1B1F3B').text(
        `${new Date(invoice.periodStart).toISOString().split('T')[0]} to ${new Date(invoice.periodEnd).toISOString().split('T')[0]}`,
        300,
        168
      );
      doc.text(`Subscription ID: ${invoice.subscriptionId}`, 300, 183);

      doc.moveTo(40, 225).lineTo(555, 225).strokeColor('#E0E0E0').stroke();

      // Table Header
      let y = 240;
      doc.fontSize(10).fillColor('#6C4BFF');
      doc.text('Item Description', 40, y);
      doc.text('Qty', 250, y, { width: 40, align: 'right' });
      doc.text('Unit (Rs)', 300, y, { width: 60, align: 'right' });
      doc.text('Tax', 370, y, { width: 50, align: 'right' });
      doc.text('Total (Rs)', 450, y, { width: 105, align: 'right' });

      y += 18;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#6C4BFF').stroke();

      // Lines
      doc.fillColor('#1B1F3B').fontSize(9);
      for (const line of invoice.lines) {
        y += 12;
        const unitInRs = (line.unitPrice / 100).toFixed(2);
        const lineGrossInRs = (line.grossAmount / 100).toFixed(2);
        const taxRateStr = `${line.taxRate}%`;

        doc.text(line.description, 40, y, { width: 200 });
        doc.text(String(line.quantity), 250, y, { width: 40, align: 'right' });
        doc.text(unitInRs, 300, y, { width: 60, align: 'right' });
        doc.text(taxRateStr, 370, y, { width: 50, align: 'right' });
        doc.text(lineGrossInRs, 450, y, { width: 105, align: 'right' });
        y += 14;
      }

      y += 10;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#E0E0E0').stroke();

      // Totals Summary
      y += 15;
      const subtotalRs = (invoice.subtotal / 100).toFixed(2);
      const discountRs = (invoice.discountTotal / 100).toFixed(2);
      const taxRs = (invoice.taxTotal / 100).toFixed(2);
      const totalRs = (invoice.total / 100).toFixed(2);
      const paidRs = (invoice.amountPaid / 100).toFixed(2);
      const balanceRs = (invoice.balance / 100).toFixed(2);

      const rightColLabel = 360;
      const rightColVal = 470;

      doc.fontSize(10);
      doc.text('Subtotal:', rightColLabel, y);
      doc.text(`Rs ${subtotalRs}`, rightColVal, y, { align: 'right', width: 85 });
      y += 16;

      if (invoice.discountTotal > 0) {
        doc.text('Discounts:', rightColLabel, y);
        doc.text(`-Rs ${discountRs}`, rightColVal, y, { align: 'right', width: 85 });
        y += 16;
      }

      doc.text('Tax Total:', rightColLabel, y);
      doc.text(`Rs ${taxRs}`, rightColVal, y, { align: 'right', width: 85 });
      y += 16;

      doc.fontSize(12).fillColor('#6C4BFF');
      doc.text('Grand Total:', rightColLabel, y);
      doc.text(`Rs ${totalRs}`, rightColVal, y, { align: 'right', width: 85 });
      y += 18;

      doc.fontSize(10).fillColor('#1B1F3B');
      doc.text('Amount Paid:', rightColLabel, y);
      doc.text(`Rs ${paidRs}`, rightColVal, y, { align: 'right', width: 85 });
      y += 16;

      doc.fontSize(11).fillColor(invoice.balance > 0 ? '#FF7A59' : '#00C2A8');
      doc.text('Balance Due:', rightColLabel, y);
      doc.text(`Rs ${balanceRs}`, rightColVal, y, { align: 'right', width: 85 });

      // Terms & Notes
      if (invoice.terms || invoice.notes) {
        y += 40;
        doc.moveTo(40, y).lineTo(555, y).strokeColor('#E0E0E0').stroke();
        y += 10;
        doc.fontSize(9).fillColor('#666666');
        if (invoice.terms) {
          doc.text(`Terms: ${invoice.terms}`, 40, y, { width: 500 });
          y += 15;
        }
        if (invoice.notes) {
          doc.text(`Notes: ${invoice.notes}`, 40, y, { width: 500 });
        }
      }

      doc.end();
    });
  }

  /**
   * Queue email with PDF attachment in EmailOutbox
   */
  public async sendInvoice(
    tenantId: string,
    invoiceId: string,
    recipientEmail?: string,
    customMessage?: string
  ): Promise<{ success: boolean; emailOutboxId: string; sentAt: Date }> {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      const error: any = new Error(`Invoice ${invoiceId} not found`);
      error.statusCode = 404;
      error.code = 'INVOICE_NOT_FOUND';
      throw error;
    }

    const targetEmail = recipientEmail || invoice.customerEmail;
    const pdfBuffer = await this.generateInvoicePdf(invoice);
    const emailId = `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sentAt = clock.now();

    const emailOutboxRow: EmailOutboxModel = {
      id: emailId,
      tenantId,
      to: targetEmail,
      subject: `Invoice ${invoice.invoiceNumber} from LoopDesk`,
      bodyText: customMessage || `Dear ${invoice.customerName},\n\nPlease find attached your invoice ${invoice.invoiceNumber} for Rs ${(invoice.total / 100).toFixed(2)}.\n\nThank you for choosing LoopDesk!`,
      attachmentName: `${invoice.invoiceNumber}.pdf`,
      attachmentData: pdfBuffer,
      status: 'SENT', // Dev mailer writes outbox row as processed
      sentAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    emailOutboxDatabase.set(emailId, emailOutboxRow);

    invoice.sentAt = sentAt;
    invoice.updatedAt = new Date();
    invoiceDatabase.set(invoiceId, invoice);

    await addAuditEvent(invoice.subscriptionId, 'INVOICE_SENT', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      recipient: targetEmail,
      emailOutboxId: emailId,
    });

    return {
      success: true,
      emailOutboxId: emailId,
      sentAt,
    };
  }

  /**
   * Recompute invoice payments and update balance/status.
   * Called by PaymentService inside a transaction.
   */
  public updateInvoicePaymentTotals(
    invoiceId: string,
    totalPaidPaise: number
  ): InvoiceModel {
    const invoice = invoiceDatabase.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found for payment recalculation`);
    }

    invoice.amountPaid = totalPaidPaise;
    invoice.balance = Math.max(0, invoice.total - totalPaidPaise);

    if (invoice.balance === 0) {
      invoice.status = 'PAID';
    } else if (invoice.status === 'PAID' && invoice.balance > 0) {
      invoice.status = 'CONFIRMED';
    }

    invoice.updatedAt = new Date();
    invoiceDatabase.set(invoiceId, invoice);
    return invoice;
  }

  // Clear helper for tests
  public clearStore(): void {
    invoiceDatabase.clear();
    invoiceCounters.clear();
    emailOutboxDatabase.clear();
  }
}

export const invoiceService = new InvoiceService();
