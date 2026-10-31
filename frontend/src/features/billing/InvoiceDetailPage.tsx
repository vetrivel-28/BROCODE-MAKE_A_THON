import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api.js';
import { Invoice } from './types.js';
import { PaymentModel } from '../payments/types.js';
import {
  Button,
  Card,
  StatusPill,
  Table,
  Column,
  useToast,
} from '../../shared/components/index.js';

interface InvoiceDetailPageProps {
  invoiceId: string;
  onBack: () => void;
  onOpenRecordPayment: (invoice: Invoice) => void;
}

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({
  invoiceId,
  onBack,
  onOpenRecordPayment,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<PaymentModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { showToast } = useToast();

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const inv = await api.get<Invoice>(`/invoices/${invoiceId}`);
      setInvoice(inv);

      // Fetch payments for this invoice
      const paymentsRes = await api.get<{ data: PaymentModel[] }>(`/invoices/${invoiceId}/payments`);
      setPayments(paymentsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
      showToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  const handleConfirm = async () => {
    if (!invoice) return;
    setIsConfirming(true);
    try {
      const confirmed = await api.post<Invoice>(`/invoices/${invoice.id}/confirm`);
      setInvoice(confirmed);
      showToast('success', 'Confirmed', `Invoice ${confirmed.invoiceNumber} is now confirmed and locked.`);
    } catch (err: any) {
      showToast('error', 'Confirmation Failed', err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;

    setIsCancelling(true);
    try {
      const cancelled = await api.post<Invoice>(`/invoices/${invoice.id}/cancel`);
      setInvoice(cancelled);
      showToast('warning', 'Invoice Cancelled', `Invoice ${cancelled.invoiceNumber} has been cancelled.`);
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    setIsSending(true);
    try {
      const result = await api.post<{ success: boolean; emailOutboxId: string; sentAt: string }>(
        `/invoices/${invoice.id}/send`,
        {}
      );
      showToast(
        'success',
        'Invoice Sent',
        `Queued email with PDF attachment to ${invoice.customerEmail} (Outbox ID: ${result.emailOutboxId}).`
      );
      fetchInvoiceData();
    } catch (err: any) {
      showToast('error', 'Failed to Send', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handlePrintPdf = () => {
    if (!invoice) return;
    window.open(api.getPdfBlobUrl(`/invoices/${invoice.id}/pdf`), '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 bg-warm-light border border-warm/20 rounded-[16px] text-warm space-y-4">
        <p className="font-semibold">{error || 'Invoice not found'}</p>
        <Button variant="secondary" onClick={onBack}>
          &larr; Back to Invoices
        </Button>
      </div>
    );
  }

  const lineColumns: Column<any>[] = [
    {
      header: 'Item & Description',
      accessorKey: 'description',
      cell: (l) => <span className="font-medium text-text">{l.description}</span>,
    },
    {
      header: 'Qty',
      accessorKey: 'quantity',
      className: 'text-right',
    },
    {
      header: 'Unit Price (INR)',
      className: 'text-right',
      cell: (l) => <span className="font-mono">Rs {(l.unitPrice / 100).toFixed(2)}</span>,
    },
    {
      header: 'Discount',
      className: 'text-right',
      cell: (l) => (
        <span className="font-mono text-gray-500">
          {l.discountAmount > 0 ? `-Rs ${(l.discountAmount / 100).toFixed(2)}` : 'Rs 0.00'}
        </span>
      ),
    },
    {
      header: 'Tax Rate',
      className: 'text-right',
      cell: (l) => <span className="font-mono text-xs">{l.taxRate}%</span>,
    },
    {
      header: 'Tax Amount',
      className: 'text-right',
      cell: (l) => <span className="font-mono">Rs {(l.taxAmount / 100).toFixed(2)}</span>,
    },
    {
      header: 'Gross (INR)',
      className: 'text-right',
      cell: (l) => (
        <span className="font-mono font-bold text-text">
          Rs {(l.grossAmount / 100).toFixed(2)}
        </span>
      ),
    },
  ];

  const paymentColumns: Column<PaymentModel>[] = [
    {
      header: 'Payment ID',
      accessorKey: 'id',
      cell: (p) => <span className="font-mono text-xs text-gray-600">{p.id}</span>,
    },
    {
      header: 'Date',
      cell: (p) => (
        <span className="text-xs text-gray-600">
          {new Date(p.paidOn).toISOString().split('T')[0]}
        </span>
      ),
    },
    {
      header: 'Method',
      accessorKey: 'method',
      cell: (p) => (
        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 rounded-full">
          {p.method}
        </span>
      ),
    },
    {
      header: 'Amount (INR)',
      cell: (p) => (
        <span className="font-mono font-bold text-accent">
          Rs {(p.amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Reference / Note',
      cell: (p) => (
        <span className="text-xs text-gray-500">
          {p.reference || p.note || 'Direct payment'}
        </span>
      ),
    },
  ];

  const canConfirm = invoice.status === 'DRAFT';
  const canRecordPayment = invoice.status === 'CONFIRMED' && invoice.balance > 0;
  const canCancel =
    invoice.status === 'DRAFT' ||
    (invoice.status === 'CONFIRMED' && invoice.amountPaid === 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header with Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                {invoice.invoiceNumber}
              </h1>
              <StatusPill status={invoice.status} isOverdue={invoice.isOverdue} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Subscription ID: <span className="font-mono font-semibold">{invoice.subscriptionId}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canConfirm && (
            <Button
              variant="primary"
              size="md"
              isLoading={isConfirming}
              onClick={handleConfirm}
            >
              Confirm Invoice
            </Button>
          )}

          {canRecordPayment && (
            <Button
              variant="accent"
              size="md"
              onClick={() => onOpenRecordPayment(invoice)}
            >
              Record Payment
            </Button>
          )}

          <Button variant="secondary" size="md" onClick={handlePrintPdf}>
            Print / Download PDF
          </Button>

          <Button
            variant="outline"
            size="md"
            isLoading={isSending}
            onClick={handleSendEmail}
          >
            {invoice.sentAt ? 'Re-send Email' : 'Send Email'}
          </Button>

          {canCancel && (
            <Button
              variant="danger"
              size="md"
              isLoading={isCancelling}
              onClick={handleCancel}
            >
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Customer Details">
          <p className="font-semibold text-text text-base">{invoice.customerName}</p>
          <p className="text-sm text-gray-500 mt-1">{invoice.customerEmail}</p>
          <p className="text-xs text-gray-400 mt-2">Customer ID: {invoice.customerId}</p>
          {invoice.sentAt && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-accent font-medium">
              Email sent on {new Date(invoice.sentAt).toLocaleString()}
            </div>
          )}
        </Card>

        <Card title="Dates & Billing Cycle">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Issue Date:</span>
              <span className="font-medium">{new Date(invoice.issueDate).toISOString().split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date:</span>
              <span className={`font-semibold ${invoice.isOverdue ? 'text-warm' : ''}`}>
                {new Date(invoice.dueDate).toISOString().split('T')[0]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Period Start:</span>
              <span>{new Date(invoice.periodStart).toISOString().split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Period End:</span>
              <span>{new Date(invoice.periodEnd).toISOString().split('T')[0]}</span>
            </div>
          </div>
        </Card>

        <Card title="Payment Status">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Billed:</span>
              <span className="font-mono font-medium">Rs {(invoice.total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-mono font-semibold text-accent">
                Rs {(invoice.amountPaid / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-gray-100">
              <span className="font-semibold text-text">Balance Due:</span>
              <span
                className={`font-mono font-bold text-lg ${
                  invoice.balance === 0 ? 'text-accent' : 'text-warm'
                }`}
              >
                Rs {(invoice.balance / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Line Items */}
      <Card title="Line Items & Tax Breakdown">
        <Table columns={lineColumns} data={invoice.lines} />

        {/* Financial Summary */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-sm bg-gray-50/70 p-4 rounded-[16px] border border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono">Rs {(invoice.subtotal / 100).toFixed(2)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-accent font-medium">
                <span>Discounts:</span>
                <span className="font-mono">-Rs {(invoice.discountTotal / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST Tax Total:</span>
              <span className="font-mono">Rs {(invoice.taxTotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text pt-2 border-t border-gray-200">
              <span>Grand Total:</span>
              <span className="font-mono text-primary">Rs {(invoice.total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Amount Paid:</span>
              <span className="font-mono">Rs {(invoice.amountPaid / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-warm pt-1 border-t border-gray-200">
              <span>Balance Due:</span>
              <span className="font-mono">Rs {(invoice.balance / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payments History */}
      <Card title="Payments History">
        <Table
          columns={paymentColumns}
          data={payments}
          emptyMessage="No payments recorded for this invoice yet."
        />
      </Card>

      {/* Terms & Notes */}
      {(invoice.terms || invoice.notes) && (
        <Card title="Terms & Notes">
          <div className="text-sm text-gray-600 space-y-2">
            {invoice.terms && (
              <p>
                <span className="font-semibold text-text">Payment Terms:</span> {invoice.terms}
              </p>
            )}
            {invoice.notes && (
              <p>
                <span className="font-semibold text-text">Notes:</span> {invoice.notes}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

