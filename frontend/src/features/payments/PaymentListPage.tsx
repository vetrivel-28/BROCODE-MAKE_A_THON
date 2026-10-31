import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api.js';
import { PaymentModel, PaymentsResponse } from './types.js';
import {
  Table,
  Card,
  Pagination,
  Input,
  Button,
  Column,
  useToast,
} from '../../shared/components/index.js';

interface PaymentListPageProps {
  onSelectInvoice?: (invoiceId: string) => void;
}

export const PaymentListPage: React.FC<PaymentListPageProps> = ({ onSelectInvoice }) => {
  const [payments, setPayments] = useState<PaymentModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [methodFilter, setMethodFilter] = useState('');
  const [invoiceIdSearch, setInvoiceIdSearch] = useState('');

  const { showToast } = useToast();

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
        ...(methodFilter ? { method: methodFilter } : {}),
        ...(invoiceIdSearch ? { invoiceId: invoiceIdSearch } : {}),
      };

      const res = await api.get<PaymentsResponse>('/payments', params);
      setPayments(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
      showToast('error', 'Fetch Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const columns: Column<PaymentModel>[] = [
    {
      header: 'Payment ID',
      accessorKey: 'id',
      cell: (p) => <span className="font-mono text-xs text-gray-500">{p.id}</span>,
    },
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (p) => (
        <span
          onClick={() => onSelectInvoice && onSelectInvoice(p.invoiceId)}
          className="font-semibold text-primary hover:underline cursor-pointer"
        >
          {p.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Method',
      accessorKey: 'method',
      cell: (p) => (
        <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 rounded-full text-text">
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
      header: 'Paid Date',
      cell: (p) => (
        <span className="text-xs text-gray-600">
          {new Date(p.paidOn).toISOString().split('T')[0]}
        </span>
      ),
    },
    {
      header: 'Reference / Note',
      cell: (p) => (
        <span className="text-xs text-gray-500">
          {p.reference ? `Ref: ${p.reference}` : p.note || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Payments & Collections</h1>
        <p className="text-sm text-gray-500 mt-1">
          Audit ledger of recorded customer collections (CASH, UPI, CARD, BANK_TRANSFER, CHEQUE).
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Filter by Invoice ID..."
              value={invoiceIdSearch}
              onChange={(e) => setInvoiceIdSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 text-sm bg-surface text-text border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <Button variant="primary" type="submit">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-warm-light border border-warm/20 rounded-[16px] text-warm flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchPayments}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={payments}
          isLoading={isLoading}
          emptyMessage="No payment records found."
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Card>
    </div>
  );
};
