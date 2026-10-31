import React, { useEffect, useState } from 'react';

export const CustomizationStudioPage: React.FC = () => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any | null>(null);
  const [passport, setPassport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bundle selection
  const [selectedBundleItems, setSelectedBundleItems] = useState<string[]>([]);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [catRes, walRes, passRes] = await Promise.all([
        fetch('/api/payments/customizations/catalog', { headers }),
        fetch('/api/payments/wallet', { headers }),
        fetch('/api/identity/passport', { headers })
      ]);

      const [catData, walData, passData] = await Promise.all([
        catRes.json(),
        walRes.json(),
        passRes.json()
      ]);

      setCatalog(catData.catalog || []);
      setWallet(walData);
      setPassport(passData);
    } catch (err: any) {
      setError(err.message || 'Failed to load customization studio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (itemCode: string) => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/payments/customizations/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Purchase failed');
      }
      setMessage(`Successfully unlocked "${data.item.name}"! Wallet balance and slot updated.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTopUp = async () => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/payments/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amountInr: 1000,
          razorpayPaymentId: `pay_test_topup_${Date.now()}`
        })
      });
      const data = await res.json();
      setMessage(`Added ₹1,000.00 to Customization Wallet via Razorpay test mode.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleBundleSelection = (code: string) => {
    if (selectedBundleItems.includes(code)) {
      setSelectedBundleItems(selectedBundleItems.filter((c) => c !== code));
    } else {
      if (selectedBundleItems.length < 5) {
        setSelectedBundleItems([...selectedBundleItems, code]);
      }
    }
  };

  const handlePurchaseBundle = async () => {
    if (selectedBundleItems.length !== 5) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/payments/customizations/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemCodes: selectedBundleItems })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Bundle purchase failed');
      setMessage(`Bundle of 5 purchased with 20% discount (saved ₹${data.discountPaise / 100})!`);
      setSelectedBundleItems([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Customization Studio & Wallet</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6C4BFF]/10 text-[#6C4BFF]">
                Unique Feature #2
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Customize themes, fields, and modules with live wallet meter and tier slot enforcement
            </p>
          </div>

          <button
            onClick={handleTopUp}
            className="px-5 py-2.5 rounded-xl bg-[#00C2A8] hover:bg-[#009e89] text-white font-bold text-sm shadow-sm transition-all"
          >
            + Top-up Wallet (₹1,000)
          </button>
        </div>

        {/* Live Meters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wallet Balance Meter */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Customization Wallet Balance
              </span>
              <p className="text-3xl font-black mt-1 text-[#00C2A8]">
                ₹{(wallet?.balanceInr || 0).toFixed(2)}
              </p>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Stored as integer paise, never negative</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00C2A8] flex items-center justify-center text-2xl font-bold">
              ₹
            </div>
          </div>

          {/* Slots Meter */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Customization Slots ({passport?.currentTier?.name} Tier)
              </span>
              <p className="text-3xl font-black mt-1 text-[#6C4BFF]">
                {passport?.customizationSlots?.remaining || 0}{' '}
                <span className="text-sm text-gray-400 font-medium">
                  / {passport?.customizationSlots?.total || 0} Slots Remaining
                </span>
              </p>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                Standard: 2 slots cap • Custom: 10 slots cap
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6C4BFF] flex items-center justify-center text-2xl font-bold">
              ★
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-2xl border border-emerald-200">
            {message}
          </div>
        )}

        {/* Bundle Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 p-6 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#6C4BFF] uppercase tracking-wider">
              Special Offer: 5-Customization Bundle
            </span>
            <h3 className="text-base font-bold mt-0.5">Bundle 5 items and save 20% instantly</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select any 5 items below ({selectedBundleItems.length}/5 selected).
            </p>
          </div>

          <button
            onClick={handlePurchaseBundle}
            disabled={selectedBundleItems.length !== 5}
            className="px-5 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-all"
          >
            Buy Bundle (20% Off)
          </button>
        </div>

        {/* 10 Priced Customization Items Catalog */}
        <div>
          <h2 className="text-lg font-bold mb-4">Priced Customizations Catalog (10 Items)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map((item) => {
              const isSelectedForBundle = selectedBundleItems.includes(item.code);
              return (
                <div
                  key={item.id}
                  className={`bg-white p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelectedForBundle ? 'border-[#6C4BFF] ring-2 ring-[#6C4BFF] bg-purple-50/20' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                        {item.category}
                      </span>
                      <span className="text-lg font-black text-[#6C4BFF]">
                        ₹{item.priceInr}
                      </span>
                    </div>

                    <h3 className="font-bold text-base mt-3 text-[#1B1F3B]">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBundleSelection(item.code)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                        isSelectedForBundle
                          ? 'border-[#6C4BFF] text-[#6C4BFF] bg-purple-50'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {isSelectedForBundle ? '✓ In Bundle' : '+ Add to Bundle'}
                    </button>

                    <button
                      onClick={() => handlePurchase(item.code)}
                      className="px-4 py-1.5 rounded-xl bg-[#1B1F3B] hover:bg-[#6C4BFF] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Buy (1 Slot)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
