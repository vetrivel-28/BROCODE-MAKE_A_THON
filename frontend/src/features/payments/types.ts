export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';

export interface PaymentModel {
  id: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  method: PaymentMethod;
  amount: number; // Integer paise
  paidOn: string;
  reference?: string;
  note?: string;
  gatewayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  data: PaymentModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
