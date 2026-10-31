import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api.js';
import { TaxRule } from './types.js';
import { Button, Table, StatusPill, Modal, Input, Card, Column, useToast } from '../../shared/components/index.js';

export const TaxRulesPage: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Tax Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isInclusive, setIsInclusive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const userRole = api.getRole();
  const isAdmin = userRole === 'ADMIN';

  const fetchTaxes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: TaxRule[] }>('/taxes');
      setTaxes(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch taxes');
      showToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) {
      showToast('error', 'Validation Error', 'Tax name and rate are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/taxes', {
        name,
        rate: parseFloat(rate),
        isInclusive,
        isActive: true,
      });
      showToast('success', 'Tax Created', `Successfully configured tax rule ${name}.`);
      setIsModalOpen(false);
      setName('');
      setRate('');
      setIsInclusive(false);
      fetchTaxes();
    } catch (err: any) {
      showToast('error', 'Failed to create tax', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<TaxRule>[] = [
    {
      header: 'Tax Name',
      accessorKey: 'name',
      cell: (t) => <span className="font-semibold text-text">{t.name}</span>,
    },
    {
      header: 'Rate (%)',
      accessorKey: 'rate',
      cell: (t) => <span className="font-mono text-primary font-bold">{t.rate}%</span>,
    },
    {
      header: 'Calculation Mode',
      cell: (t) => (
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            t.isInclusive ? 'bg-highlight-light text-text' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t.isInclusive ? 'Tax-Inclusive' : 'Tax-Exclusive'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (t) => (
        <StatusPill status={t.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Tax Rules (GST)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure Indian GST rates (5%, 12%, 18%) and inclusive/exclusive rules for subscriptions.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Add New Tax Rule
          </Button>
        )}
      </div>

      {error ? (
        <div className="p-4 bg-warm-light border border-warm/20 rounded-[16px] text-warm flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchTaxes}>
            Retry
          </Button>
        </div>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={taxes}
            isLoading={isLoading}
            emptyMessage="No tax rules found. Click 'Add New Tax Rule' to configure GST."
          />
        </Card>
      )}

      {/* Modal for adding Tax Rule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add GST Tax Rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleCreateTax}>
              Save Tax Rule
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTax} className="space-y-4">
          <Input
            label="Tax Name"
            placeholder="e.g. GST 18%, GST 12%"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Rate (%)"
            type="number"
            step="0.01"
            placeholder="e.g. 18.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isInclusive"
              checked={isInclusive}
              onChange={(e) => setIsInclusive(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isInclusive" className="text-sm font-medium text-text cursor-pointer">
              Inclusive Tax (Unit price already contains this tax)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

