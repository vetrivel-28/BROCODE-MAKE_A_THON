import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api.js';
import { Invoice, InvoicesResponse } from './types.js';
import {
  Button,
  Table,
  StatusPill,
  Card,
  Pagination,
  Input,
  Modal,
  Column,
  useToast,
} from '../../shared/components/index.js';

interface InvoiceListPageProps {
  onSelectInvoice: (invoiceId: string) => void;
  onOpenRecordPayment: (invoice: Invoice) => void;
}

export const InvoiceListPage: React.FC<InvoiceListPageProps> = ({
  onSelectInvoice,
  onOpenRecordPayment,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Generate Invoice Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('sub_demo_01');
  const [periodStart, setPeriodStart] = useState('2026-11-01');
  const [isGenerating, setIsGenerating] = useState(false);

  const { showToast } = useToast();

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(overdueOnly ? { overdue: 'true' } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
      };

      const res = await api.get<InvoicesResponse>('/invoices', params);
      setInvoices(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
      showToast('error', 'Fetch Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, overdueOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const generated = await api.post<Invoice>('/invoices/generate', {
        subscriptionId,
        periodStart: new Date(periodStart).toISOString(),
      });
      showToast(
        'success',
        'Invoice Generated',
        `Invoice ${generated.invoiceNumber} created successfully.`
      );
      setIsGenModalOpen(false);
      fetchInvoices();
      onSelectInvoice(generated.id);
    } catch (err: any) {
      showToast('error', 'Generation Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (inv) => (
        <span className="font-semibold text-primary hover:underline cursor-pointer">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (inv) => (
        <div>
          <p className="font-medium text-text">{inv.customerName}</p>
          <p className="text-xs text-gray-400">{inv.customerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Issue Date',
      cell: (inv) => (
        <span className="text-xs text-gray-600">
          {new Date(inv.issueDate).toISOString().split('T')[0]}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (inv) => (
        <span className={`text-xs ${inv.isOverdue ? 'font-bold text-warm' : 'text-gray-600'}`}>
          {new Date(inv.dueDate).toISOString().split('T')[0]}
        </span>
      ),
    },
    {
      header: 'Total (INR)',
      cell: (inv) => (
        <span className="font-mono font-medium text-text">
          Rs {(inv.total / 100).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Balance (INR)',
      cell: (inv) => (
        <span
          className={`font-mono font-bold ${
            inv.balance === 0 ? 'text-accent' : 'text-warm'
          }`}
        >
          Rs {(inv.balance / 100).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (inv) => (
        <StatusPill status={inv.status} isOverdue={inv.isOverdue} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (inv) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {inv.status === 'CONFIRMED' && inv.balance > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => onOpenRecordPayment(inv)}
            >
              Pay
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelectInvoice(inv.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated recurring invoices, tracking balances, settlements, and GST compliance.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsGenModalOpen(true)}>
          + Generate Subscription Invoice
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by invoice number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm bg-surface text-text border border-gray-200 rounded-[16px] focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setOverdueOnly(!overdueOnly);
                setPage(1);
              }}
              className={`px-3 py-2 text-sm font-medium rounded-[16px] transition-all border ${
                overdueOnly
                  ? 'bg-warm-light border-warm text-warm font-semibold'
                  : 'bg-surface border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {overdueOnly ? 'Overdue Only' : 'Show All'}
            </button>

            <Button variant="primary" size="md" type="submit">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-warm-light border border-warm/20 rounded-[16px] text-warm flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchInvoices}>
            Retry
          </Button>
        </div>
      )}

      {/* Invoices Data Table */}
      <Card>
        <Table
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No invoices found matching your filters."
          onRowClick={(inv) => onSelectInvoice(inv.id)}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Card>

      {/* Quick Generate Modal */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        title="Generate Invoice from Subscription"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsGenModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isGenerating}
              onClick={handleGenerateInvoice}
            >
              Generate Invoice
            </Button>
          </>
        }
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4">
          <Input
            label="Subscription ID"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            helperText="e.g. sub_demo_01, sub_demo_02... (from seeded 20 active subscriptions)"
            required
          />
          <Input
            label="Period Start Date"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            Invoice generation is idempotent: creating an invoice for the exact same subscription and cycle period will reject duplicate runs.
          </p>
        </form>
      </Modal>
    </div>
  );
};

