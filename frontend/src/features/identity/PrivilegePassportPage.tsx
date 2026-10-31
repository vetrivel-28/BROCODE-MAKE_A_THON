import React, { useEffect, useState } from 'react';
import { identityApi, PrivilegePassportData } from './api';
import { TierUpgradeModal } from './TierUpgradeModal';

export const PrivilegePassportPage: React.FC = () => {
  const [passport, setPassport] = useState<PrivilegePassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const data = await identityApi.getPassport();
      setPassport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Privilege Passport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="text-gray-400 font-medium animate-pulse">Loading Privilege Passport...</div>
      </div>
    );
  }

  if (error || !passport) {
    const handleQuickLogin = async () => {
      try {
        setLoading(true);
        const res = await identityApi.login('aarav@brightloop.com', 'SecurePassword123#');
        localStorage.setItem('loopdesk_access_token', res.accessToken);
        localStorage.setItem('loopdesk_refresh_token', res.refreshToken);
        localStorage.setItem('loopdesk_user', JSON.stringify(res.user));
        localStorage.setItem('loopdesk_tenant', JSON.stringify(res.tenant));
        setError(null);
        await fetchPassport();
      } catch (err: any) {
        setError(err.message || 'Quick login failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <p className="text-red-600 font-bold mb-2">Error Loading Passport</p>
          <p className="text-xs text-gray-500 mb-4">{error || 'Session expired or invalid'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleQuickLogin}
              className="px-4 py-2 bg-[#6C4BFF] hover:bg-[#5839e6] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Quick Demo Login
            </button>
            <a href="/login" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all">
              Return to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { tenant, currentTier, customizationSlots, wallet, features } = passport;
  const slotPercentage =
    customizationSlots.total > 0
      ? Math.min(100, (customizationSlots.used / customizationSlots.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Privilege Passport</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#6C4BFF]/10 text-[#6C4BFF] border border-[#6C4BFF]/20">
                {currentTier.name} Tier
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Live subscription entitlement ledger for{' '}
              <span className="font-semibold text-gray-700">{tenant.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C4BFF] to-[#00C2A8] text-white font-bold text-sm shadow-sm hover:opacity-95 transition-all"
            >
              ★ Upgrade Tier
            </button>
          </div>
        </div>

        {/* 3 Overview Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Tier Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Active Subscription
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                  Active
                </span>
              </div>
              <h3 className="text-2xl font-black mt-2 text-[#6C4BFF]">{currentTier.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{currentTier.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-baseline justify-between">
              <span className="text-xs text-gray-400">Plan Rate:</span>
              <span className="text-lg font-bold">₹{currentTier.monthlyPriceInr} / mo</span>
            </div>
          </div>

          {/* Card 2: Customization Slots Meter */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Customization Slots
                </span>
                <span className="text-xs font-mono font-bold text-[#6C4BFF]">
                  {customizationSlots.remaining} Left
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-[#1B1F3B]">{customizationSlots.used}</span>
                <span className="text-gray-400 font-medium">/ {customizationSlots.total} Used</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className="bg-[#6C4BFF] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${slotPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-[11px] text-gray-400">
              Slots are determined by your tier ({currentTier.name}: {customizationSlots.total} slots)
            </div>
          </div>

          {/* Card 3: Customization Wallet */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Customization Wallet
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-[#6C4BFF] font-semibold">
                  Paise Ledger
                </span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-[#00C2A8]">
                  ₹{wallet.balanceInr.toFixed(2)}
                </span>
                <p className="text-xs text-gray-400 mt-1">Available balance for add-ons</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
              <span className="text-gray-400">Top-up with Razorpay</span>
              <a href="/studio" className="text-[#6C4BFF] font-bold hover:underline">
                Customization Studio →
              </a>
            </div>
          </div>
        </div>

        {/* Feature Entitlement Matrix */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold">Feature Privileges & Access Matrix</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live inspection of platform capabilities unlocked for this workspace
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      feature.unlocked
                        ? 'bg-emerald-50 text-[#00C2A8]'
                        : 'bg-amber-50 text-[#FF7A59]'
                    }`}
                  >
                    {feature.unlocked ? '✓' : '🔒'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#1B1F3B]">{feature.name}</h4>
                    <span className="text-[11px] text-gray-400 font-mono">
                      key: {feature.key} | Min Tier: {feature.minTier}
                    </span>
                  </div>
                </div>

                <div>
                  {feature.unlocked ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00C2A8]">
                      Active & Unlocked
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A59]/10 text-[#FF7A59] hover:bg-[#FF7A59]/20 transition-colors"
                    >
                      <span>Upgrade to {feature.upgradeRequired}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <TierUpgradeModal
            currentTier={currentTier.code}
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {
              setShowUpgradeModal(false);
              fetchPassport();
            }}
          />
        )}
      </div>
    </div>
  );
};

