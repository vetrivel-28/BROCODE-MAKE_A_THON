import React, { useState } from 'react';
import { identityApi } from './api';

interface TierUpgradeModalProps {
  currentTier: 'FREE' | 'STANDARD' | 'CUSTOM';
  onClose: () => void;
  onSuccess: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  currentTier,
  onClose,
  onSuccess
}) => {
  const [selectedTier, setSelectedTier] = useState<'STANDARD' | 'CUSTOM'>(
    currentTier === 'STANDARD' ? 'CUSTOM' : 'STANDARD'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate Razorpay test payment
      const mockPaymentId = `pay_rzp_test_${Math.random().toString(36).substring(2, 9)}`;

      await identityApi.upgradeTier({
        targetTier: selectedTier,
        razorpayPaymentId: mockPaymentId
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#1B1F3B]">Upgrade Platform Tier</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Unlock higher limits, composable modules, and more customization slots
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3 my-6">
          <div
            onClick={() => setSelectedTier('STANDARD')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTier === 'STANDARD'
                ? 'border-[#6C4BFF] bg-purple-50/50 ring-2 ring-[#6C4BFF]'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-[#1B1F3B]">Standard Tier</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automated billing runs, GST rules, autopilot dunning, 2 customization slots.
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#6C4BFF]">₹580</span>
                <span className="text-[10px] text-gray-400 block">/ user / mo</span>
              </div>
            </div>
          </div>

          <div

            onClick={() => setSelectedTier('CUSTOM')}

            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTier === 'CUSTOM'
                ? 'border-[#00C2A8] bg-teal-50/50 ring-2 ring-[#00C2A8]'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-[#1B1F3B]">Custom Tier</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Composable workspace, custom dashboards, advanced roles, 10 customization slots.
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#00C2A8]">₹1,080</span>
                <span className="text-[10px] text-gray-400 block">/ user / mo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600 mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Razorpay Test Mode Checkout
          </span>
          <span className="font-mono text-gray-400">Instant Verification</span>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow transition-all disabled:opacity-50"
          >
            {loading ? 'Processing Payment...' : `Upgrade to ${selectedTier}`}
          </button>
        </div>
      </div>
    </div>
  );
};

