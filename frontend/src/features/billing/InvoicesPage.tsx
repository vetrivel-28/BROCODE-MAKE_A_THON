import React, { useEffect, useState } from 'react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Payment modal state
  const [paymentModalInv, setPaymentModalInv] = useState<any | null>(null);
  const [payAmountInr, setPayAmountInr] = useState(0);
  const [payMethod, setPayMethod] = useState('UPI');

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv: any) => {
    setPaymentModalInv(inv);
    setPayAmountInr(inv.balancePaise / 100);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/billing/invoices/${paymentModalInv.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        amountInr: payAmountInr,
        method: payMethod,
        note: 'Customer manual clearance'
      })
    });
    setPaymentModalInv(null);
    await fetchInvoices();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Invoices & Payments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Automated invoice lifecycle with real-time balance reconciliation
            </p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-sm">All Invoices ({invoices.length})</h3>
            <span className="text-xs text-gray-400">Paid and outstanding always reconciled</span>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No invoices generated yet. Run billing to create invoices.</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6C4BFF]">{inv.invoiceNumber}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inv.status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mt-1">{inv.customerName}</h4>
                    <span className="text-xs text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="font-black text-sm text-[#1B1F3B] block">
                        ₹{(inv.totalPaise / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-[#FF7A59]">
                        {inv.balancePaise > 0 ? `₹${(inv.balancePaise / 100).toLocaleString('en-IN')} balance` : 'Paid in full'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
                      >
                        🖨️ A4 PDF
                      </button>

                      {inv.balancePaise > 0 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-3 py-1.5 rounded-xl bg-[#00C2A8] text-white text-xs font-bold shadow-sm hover:opacity-90"
                        >
                          + Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Record Payment Modal */}
        {paymentModalInv && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-1">Record Payment</h3>
              <p className="text-xs text-gray-500 mb-4 font-mono">Invoice: {paymentModalInv.invoiceNumber}</p>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Payment Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmountInr}
                    onChange={(e) => setPayAmountInr(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Outstanding balance: ₹{paymentModalInv.balancePaise / 100}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD (Razorpay)</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setPaymentModalInv(null)}
                    className="px-4 py-2 text-xs text-gray-500 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#00C2A8] text-white text-xs font-bold shadow"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* A4 Invoice Print Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 my-8">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
                <div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#6C4BFF] text-white font-black text-xl mb-3">
                    L
                  </div>
                  <h2 className="text-2xl font-black text-[#1B1F3B]">TAX INVOICE</h2>
                  <p className="text-xs font-mono text-[#6C4BFF] font-bold mt-1">{selectedInvoice.invoiceNumber}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block">Status</span>
                  <span className="text-sm font-black text-emerald-600 uppercase">{selectedInvoice.status}</span>
                  <p className="text-xs text-gray-400 mt-2">Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-6 p-4 rounded-2xl bg-gray-50 text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">Billed To</span>
                <p className="font-bold text-sm text-[#1B1F3B]">{selectedInvoice.customerName}</p>
                <p className="text-gray-500">{selectedInvoice.customerEmail}</p>
              </div>

              {/* Lines */}
              <table className="w-full text-xs text-left mb-6">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.lines.map((l: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 font-semibold">{l.description}</td>
                      <td className="py-3 text-right">{l.quantity}</td>
                      <td className="py-3 text-right">₹{l.unitPricePaise / 100}</td>
                      <td className="py-3 text-right font-bold">₹{l.totalPaise / 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 flex justify-end text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotalPaise / 100}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (18%):</span>
                    <span>₹{selectedInvoice.taxPaise / 100}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#1B1F3B] pt-2 border-t border-gray-100">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.totalPaise / 100}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-600 pt-1">
                    <span>Paid:</span>
                    <span>₹{selectedInvoice.amountPaidPaise / 100}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#FF7A59]">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoice.balancePaise / 100}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
