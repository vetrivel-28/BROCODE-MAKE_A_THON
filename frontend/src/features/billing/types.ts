export interface TaxRule {
  id: string;
  tenantId: string;
  name: string;
  rate: number;
  isInclusive: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;        // Paise
  discountAmount: number;   // Paise
  netAmount: number;        // Paise
  taxId?: string;
  taxRate: number;          // %
  taxAmount: number;        // Paise
  grossAmount: number;      // Paise
  isTaxInclusive: boolean;
  productId?: string;
  variantId?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  subtotal: number;       // Paise
  discountTotal: number;  // Paise
  taxTotal: number;       // Paise
  total: number;          // Paise
  amountPaid: number;     // Paise
  balance: number;        // Paise
  notes?: string;
  terms?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
  isOverdue?: boolean;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

