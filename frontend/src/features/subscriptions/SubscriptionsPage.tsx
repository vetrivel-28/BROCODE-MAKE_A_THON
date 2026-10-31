import React, { useEffect, useState } from 'react';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New quote form
  const [showNewModal, setShowNewModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [seats, setSeats] = useState(5);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [subsRes, discRes] = await Promise.all([
        fetch('/api/subscriptions', { headers }),
        fetch('/api/subscriptions/discounts/list', { headers })
      ]);
      const subs = await subsRes.json();
      const disc = await discRes.json();
      setSubscriptions(subs.subscriptions || []);
      setDiscounts(disc.discounts || []);
      if (subs.subscriptions && subs.subscriptions.length > 0 && !selectedSub) {
        loadSubscriptionDetail(subs.subscriptions[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedSub(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Check seat suggestion as user changes seats
  useEffect(() => {
    if (seats >= 5) {
      setSuggestion('⚡ Smart Discount Engine: 5+ seats qualifies for ₹500 discount voucher (SCALE500)');
    } else {
      setSuggestion(null);
    }
  }, [seats]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/subscriptions/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    await fetchSubscriptions();
    await loadSubscriptionDetail(id);
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customerName,
        customerEmail,
        lines: [
          {
            productName: 'LoopDesk Enterprise Suite',
            variantName: 'Brand Odoo Integration',
            quantity: seats,
            unitPriceInr: 5559,
            taxPercent: 18
          }
        ]
      })
    });
    setShowNewModal(false);
    setCustomerName('');
    setCustomerEmail('');
    fetchSubscriptions();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Subscription Management</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6C4BFF]/10 text-[#6C4BFF]">
                Smart Engine Active
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Contracts, guarded status machine, and audit timeline
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-sm transition-all"
          >
            + Create Quotation
          </button>
        </div>

        {/* Smart Discount Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 via-teal-500/10 to-amber-500/10 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏷️</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C4BFF]">
                Smart Discount Engine (Unique Feature #4)
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Discounts automatically apply on the next generated invoice, respect usage caps, and auto-suggest on seat growth.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {discounts.map((d) => (
              <span key={d.id} className="text-xs bg-white px-2.5 py-1 rounded-lg border font-mono font-bold text-[#6C4BFF]">
                {d.code} ({d.type === 'PERCENT' ? `${d.value}%` : `₹${d.value / 100}`})
              </span>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-sm">All Subscriptions ({subscriptions.length})</h3>
              <span className="text-xs text-gray-400">Click to inspect audit trail</span>
            </div>

            <div className="divide-y divide-gray-100">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => loadSubscriptionDetail(sub.id)}
                  className={`p-4 cursor-pointer transition-colors flex justify-between items-center ${
                    selectedSub?.id === sub.id ? 'bg-purple-50/50' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6C4BFF]">{sub.subscriptionNumber}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-[#00C2A8]'
                            : sub.status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-700'
                            : sub.status === 'QUOTATION'
                            ? 'bg-amber-100 text-[#FF7A59]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mt-1">{sub.customerName}</h4>
                    <p className="text-xs text-gray-400">{sub.planName}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-[#1B1F3B]">
                      ₹{(sub.totalPaise / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 block">per cycle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Detail & Audit Timeline (Unique Feature #8) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            {selectedSub ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-[#6C4BFF]">{selectedSub.subscriptionNumber}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{selectedSub.status}</span>
                  </div>
                  <h3 className="text-xl font-black mt-1">{selectedSub.customerName}</h3>
                  <p className="text-xs text-gray-500">{selectedSub.customerEmail}</p>
                </div>

                {/* Status Machine Transitions */}
                <div className="p-3 bg-[#F7F8FC] rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Lifecycle Actions
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSub.status === 'QUOTATION' && (
                      <button
                        onClick={() => handleStatusChange(selectedSub.id, 'CONFIRMED')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm"
                      >
                        ✓ Confirm Quote
                      </button>
                    )}
                    {selectedSub.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(selectedSub.id, 'ACTIVE')}
                        className="px-3 py-1.5 rounded-lg bg-[#00C2A8] text-white text-xs font-bold shadow-sm"
                      >
                        ⚡ Activate Billing
                      </button>
                    )}
                    {selectedSub.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedSub.id, 'CLOSED')}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold"
                        >
                          Close Plan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subscription Audit Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Subscription Timeline (Audit Trail)
                  </h4>
                  <div className="space-y-3">
                    {(selectedSub.timeline || []).map((ev: any) => (
                      <div key={ev.id} className="relative pl-4 border-l-2 border-[#6C4BFF]/30 pb-2">
                        <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#6C4BFF]"></span>
                        <p className="text-xs font-bold text-[#1B1F3B]">{ev.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{ev.description}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">Select a subscription to view details</div>
            )}
          </div>
        </div>

        {/* Quotation Creation Modal */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4">New Customer Quotation</h3>
              <form onSubmit={handleCreateSubscription} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Customer / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Acme Technologies"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@acme.com"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Seat Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>

                {suggestion && (
                  <div className="p-3 bg-teal-50 text-[#00C2A8] text-xs font-semibold rounded-xl border border-teal-200">
                    {suggestion}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs text-gray-500 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#6C4BFF] text-white text-xs font-bold shadow"
                  >
                    Issue Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

