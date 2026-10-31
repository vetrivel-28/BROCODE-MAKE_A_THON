import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api.js';
import { Invoice } from '../billing/types.js';
import { PaymentMethod } from './types.js';
import { Modal, Button, Input, useToast } from '../../shared/components/index.js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [amountInRs, setAmountInRs] = useState('');
  const [paidOn, setPaidOn] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (invoice) {
      // Prefill amount with remaining balance
      setAmountInRs((invoice.balance / 100).toFixed(2));
      setPaidOn(new Date().toISOString().split('T')[0]);
      setMethod('UPI');
      setReference('');
      setNote('');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const maxBalanceInRs = invoice.balance / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredAmount = parseFloat(amountInRs);

    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid payment amount greater than Rs 0.');
      return;
    }

    if (enteredAmount > maxBalanceInRs) {
      showToast(
        'error',
        'Overpayment Blocked',
        `Payment amount (Rs ${enteredAmount.toFixed(2)}) exceeds invoice balance (Rs ${maxBalanceInRs.toFixed(2)}).`
      );
      return;
    }

    const amountInPaise = Math.round(enteredAmount * 100);

    setIsSubmitting(true);
    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        method,
        amount: amountInPaise,
        paidOn: new Date(paidOn).toISOString(),
        reference: reference || undefined,
        note: note || undefined,
      });

      showToast(
        'success',
        'Payment Recorded',
        `Successfully recorded Rs ${enteredAmount.toFixed(2)} via ${method}.`
      );
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Payment Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" isLoading={isSubmitting} onClick={handleSubmit}>
            Confirm Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance alert pill */}
        <div className="p-3 bg-primary-light/50 border border-primary/20 rounded-[16px] text-xs flex justify-between items-center text-text">
          <span>Outstanding Balance:</span>
          <span className="font-mono font-bold text-sm text-primary">
            Rs {maxBalanceInRs.toFixed(2)}
          </span>
        </div>

        {/* Method selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Payment Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3.5 py-2 text-sm bg-surface text-text border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        {/* Amount */}
        <Input
          label="Payment Amount (INR)"
          type="number"
          step="0.01"
          max={maxBalanceInRs}
          value={amountInRs}
          onChange={(e) => setAmountInRs(e.target.value)}
          helperText={`Partial payments permitted. Maximum: Rs ${maxBalanceInRs.toFixed(2)}`}
          required
        />

        {/* Payment Date */}
        <Input
          label="Payment Date"
          type="date"
          value={paidOn}
          onChange={(e) => setPaidOn(e.target.value)}
          required
        />

        {/* Reference */}
        <Input
          label="Reference / Transaction ID"
          placeholder="e.g. UPI Ref #, Cheque #, UTR #"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        {/* Note */}
        <Input
          label="Internal Note"
          placeholder="Optional remark or reconciliation comment"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Modal>
  );
};
