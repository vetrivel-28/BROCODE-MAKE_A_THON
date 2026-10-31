import { clock } from '../billing/clock.service.js';
import { invoiceService, InvoiceModel } from '../billing/invoice.service.js';
import { addAuditEvent } from '../billing/contracts.js';
import { RecordPaymentInput, QueryPaymentsInput, paymentMethodSchema } from './payment.schema.js';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';

export interface PaymentModel {
  id: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  method: PaymentMethod;
  amount: number; // Integer paise
  paidOn: Date;
  reference?: string;
  note?: string;
  gatewayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory payment store
const paymentDatabase = new Map<string, PaymentModel>();

export class PaymentService {
  /**
   * Records a payment against an invoice in an atomic transaction:
   * 1. Confirms invoice status is CONFIRMED
   * 2. Validates amount > 0 and amount <= invoice.balance
   * 3. Inserts payment record
   * 4. Recomputes amountPaid and balance by summing payments from table (never by simple addition)
   * 5. Transitions invoice to PAID if balance reaches 0
   * 6. Emits audit event
   */
  public async recordPayment(
    tenantId: string,
    invoiceId: string,
    input: RecordPaymentInput,
    tx?: any
  ): Promise<{ payment: PaymentModel; invoice: InvoiceModel }> {
    const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
    if (!invoice) {
      const error: any = new Error(`Invoice ${invoiceId} not found`);
      error.statusCode = 404;
      error.code = 'INVOICE_NOT_FOUND';
      throw error;
    }

    if (invoice.status === 'DRAFT') {
      const error: any = new Error(
        `Cannot accept payment on a DRAFT invoice. Invoice must be CONFIRMED first.`
      );
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    if (invoice.status === 'CANCELLED') {
      const error: any = new Error(`Cannot record payment on a CANCELLED invoice.`);
      error.statusCode = 409;
      error.code = 'INVALID_TRANSITION';
      throw error;
    }

    if (invoice.status === 'PAID' || invoice.balance <= 0) {
      const error: any = new Error(`Invoice is already fully PAID.`);
      error.statusCode = 409;
      error.code = 'INVOICE_ALREADY_PAID';
      throw error;
    }

    if (input.amount <= 0) {
      const error: any = new Error(`Payment amount must be greater than 0 paise.`);
      error.statusCode = 400;
      error.code = 'INVALID_AMOUNT';
      throw error;
    }

    if (input.amount > invoice.balance) {
      const error: any = new Error(
        `Payment amount of Rs ${(input.amount / 100).toFixed(2)} exceeds invoice balance of Rs ${(invoice.balance / 100).toFixed(2)}.`
      );
      error.statusCode = 400;
      error.code = 'OVERPAYMENT_NOT_ALLOWED';
      throw error;
    }

    // Enforce unique gatewayPaymentId if provided
    if (input.gatewayPaymentId) {
      const existingGateway = Array.from(paymentDatabase.values()).find(
        (p) => p.gatewayPaymentId === input.gatewayPaymentId
      );
      if (existingGateway) {
        const error: any = new Error(
          `Payment with gatewayPaymentId ${input.gatewayPaymentId} already processed.`
        );
        error.statusCode = 409;
        error.code = 'DUPLICATE_PAYMENT';
        throw error;
      }
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const payment: PaymentModel = {
      id: paymentId,
      tenantId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      method: input.method,
      amount: input.amount,
      paidOn: input.paidOn || clock.now(),
      reference: input.reference,
      note: input.note,
      gatewayPaymentId: input.gatewayPaymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Step 1: Insert payment
    paymentDatabase.set(paymentId, payment);

    // Step 2: Recompute total paid by querying the payments store for this invoice
    const allInvoicePayments = Array.from(paymentDatabase.values()).filter(
      (p) => p.invoiceId === invoiceId
    );
    const totalPaidPaise = allInvoicePayments.reduce((sum, p) => sum + p.amount, 0);

    // Step 3: Update invoice totals and transition status if settled
    const updatedInvoice = invoiceService.updateInvoicePaymentTotals(invoiceId, totalPaidPaise);

    // Step 4: Add audit event
    await addAuditEvent(
      invoice.subscriptionId,
      'PAYMENT_RECORDED',
      {
        paymentId,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        method: payment.method,
        amount: payment.amount,
        balanceRemaining: updatedInvoice.balance,
        status: updatedInvoice.status,
      },
      tx
    );

    return {
      payment,
      invoice: updatedInvoice,
    };
  }

  /**
   * Get payments with filters, date range, and pagination
   */
  public async getPayments(
    tenantId: string,
    query: QueryPaymentsInput
  ): Promise<{ data: PaymentModel[]; total: number; page: number; limit: number; totalPages: number }> {
    let payments = Array.from(paymentDatabase.values()).filter((p) => p.tenantId === tenantId);

    if (query.method) {
      payments = payments.filter((p) => p.method === query.method);
    }

    if (query.invoiceId) {
      payments = payments.filter((p) => p.invoiceId === query.invoiceId);
    }

    if (query.customerId) {
      payments = payments.filter((p) => p.customerId === query.customerId);
    }

    if (query.startDate) {
      const s = new Date(query.startDate).getTime();
      payments = payments.filter((p) => new Date(p.paidOn).getTime() >= s);
    }

    if (query.endDate) {
      const e = new Date(query.endDate).getTime();
      payments = payments.filter((p) => new Date(p.paidOn).getTime() <= e);
    }

    // Sort by paidOn desc
    payments.sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());

    const total = payments.length;
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const start = (page - 1) * limit;
    const data = payments.slice(start, start + limit);
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
   * Get all payments for a specific invoice
   */
  public async getPaymentsByInvoiceId(tenantId: string, invoiceId: string): Promise<PaymentModel[]> {
    return Array.from(paymentDatabase.values())
      .filter((p) => p.tenantId === tenantId && p.invoiceId === invoiceId)
      .sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());
  }

  // Clear helper for tests
  public clearStore(): void {
    paymentDatabase.clear();
  }
}

export const paymentService = new PaymentService();
