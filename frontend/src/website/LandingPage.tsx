import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const apps = [
    { name: 'Subscription Engine', category: 'Sales', icon: '⚡', desc: 'Automated recurring billing cycles' },
    { name: 'Invoicing & Tax', category: 'Finance', icon: '📄', desc: 'GST rules & compliant A4 invoices' },
    { name: 'Quotation Studio', category: 'Sales', icon: '💼', desc: 'One-click quotes to active contracts' },
    { name: 'Autopilot Dunning', category: 'Finance', icon: '🔔', desc: 'Overdue recovery on day 1, 3, 7, 14' },
    { name: 'Revenue Analytics', category: 'Productivity', icon: '📈', desc: 'MRR, ARR & 3-month forecast' },
    { name: 'Customer Health', category: 'Services', icon: '🎯', desc: 'Punctuality & seat growth scoring' },
    { name: 'Customization Studio', category: 'Website', icon: '🎨', desc: 'Bespoke templates, fields & themes' },
    { name: 'Catalog & Inventory', category: 'Supply Chain', icon: '📦', desc: 'Products, variants & price matrices' }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[#6C4BFF] text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6C4BFF] animate-pulse"></span>
            Brightloop Software Presents LoopDesk 2.0
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Run your B2B subscription business with{' '}
            <span className="text-[#6C4BFF] font-handwritten text-5xl sm:text-7xl block sm:inline">
              zero friction.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal">
            Pick a tier, configure your catalog, and instantly launch automated billing, smart discounts, autopilot dunning, and revenue intelligence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-base shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
            >
              Start Free Trial →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-[#1B1F3B] font-bold text-base shadow-sm transition-all"
            >
              Live Demo Login
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
            <span>✓ No credit card required</span>
            <span>✓ Pre-seeded starter packs</span>
            <span>✓ 100% automated billing</span>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black tracking-tight">Predictable Platform Tiers</h2>
            <p className="mt-2 text-sm text-gray-500">
              Per user per month in INR. Customizations are priced items paid from your Customization Wallet.
            </p>

            {/* Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-[#F7F8FC] border border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  billingCycle === 'monthly' ? 'bg-white shadow text-[#6C4BFF] font-bold' : 'text-gray-500'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-white shadow text-[#6C4BFF] font-bold' : 'text-gray-500'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-[#00C2A8] text-white text-[10px] px-1.5 py-0.5 rounded-full">2 Mos Free</span>
              </button>
            </div>
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free */}
            <div className="rounded-3xl border border-gray-200 p-8 bg-[#F7F8FC]/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Free Tier</span>
                <h3 className="text-2xl font-black mt-1">Free</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">₹0</span>
                  <span className="text-xs text-gray-500">/ user / mo</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  One app, unlimited users, fixed template, manual invoice sending.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200/80 space-y-3 text-xs">
                  <div className="flex items-center gap-2"><span>✓</span><span>1 Core App</span></div>
                  <div className="flex items-center gap-2"><span>✓</span><span>Unlimited Workspace Users</span></div>
                  <div className="flex items-center gap-2"><span>✓</span><span>Manual Invoice Sending</span></div>
                  <div className="flex items-center gap-2 text-gray-400"><span>✕</span><span>0 Customization Slots</span></div>
                  <div className="flex items-center gap-2 text-gray-400"><span>✕</span><span>No Auto-Billing Runs</span></div>
                </div>
              </div>

              <Link
                to="/signup?tier=FREE"
                className="mt-8 block text-center py-3 rounded-xl border border-gray-300 font-bold text-xs hover:bg-gray-100 transition-all"
              >
                Start Free
              </Link>
            </div>

            {/* Standard */}
            <div className="rounded-3xl border-2 border-[#6C4BFF] p-8 bg-white shadow-xl relative flex flex-col justify-between -translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6C4BFF] text-white text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <span className="text-xs font-bold text-[#6C4BFF] uppercase tracking-wider">Standard Tier</span>
                <h3 className="text-2xl font-black mt-1">Standard</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#6C4BFF]">
                    ₹{billingCycle === 'yearly' ? '483' : '580'}
                  </span>
                  <span className="text-xs text-gray-500">/ user / mo</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  All core apps, fully automated billing, 2 customization slots, basic dashboard.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-[#00C2A8] font-semibold"><span>✓</span><span>All Core Apps Included</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-semibold"><span>✓</span><span>Fully Automated Billing Runs</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-semibold"><span>✓</span><span>Smart Discount Engine</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-semibold"><span>✓</span><span>Autopilot Dunning (Day 1, 3, 7, 14)</span></div>
                  <div className="flex items-center gap-2 font-bold text-[#6C4BFF]"><span>★</span><span>2 Customization Slots</span></div>
                </div>
              </div>

              <Link
                to="/signup?tier=STANDARD"
                className="mt-8 block text-center py-3.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-xs shadow-md shadow-purple-200 transition-all"
              >
                Launch Standard Workspace
              </Link>
            </div>

            {/* Custom */}
            <div className="rounded-3xl border border-gray-200 p-8 bg-[#F7F8FC]/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#00C2A8] uppercase tracking-wider">Custom Tier</span>
                <h3 className="text-2xl font-black mt-1">Custom</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#1B1F3B]">
                    ₹{billingCycle === 'yearly' ? '900' : '1,080'}
                  </span>
                  <span className="text-xs text-gray-500">/ user / mo</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Composable workspace, advanced roles, custom dashboards & 10 slots.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200/80 space-y-3 text-xs">
                  <div className="flex items-center gap-2"><span>✓</span><span>Everything in Standard</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-bold"><span>✓</span><span>Composable Workspace (10+ Modules)</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-bold"><span>✓</span><span>Advanced Roles & Permissions</span></div>
                  <div className="flex items-center gap-2 text-[#00C2A8] font-bold"><span>✓</span><span>Custom Dashboards & Data Exports</span></div>
                  <div className="flex items-center gap-2 font-bold text-[#00C2A8]"><span>★</span><span>10 Customization Slots</span></div>
                </div>
              </div>

              <Link
                to="/signup?tier=CUSTOM"
                className="mt-8 block text-center py-3 rounded-xl border-2 border-[#00C2A8] text-[#00C2A8] hover:bg-teal-50 font-bold text-xs transition-all"
              >
                Launch Custom Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-black tracking-tight">The LoopDesk Suite</h2>
          <p className="mt-2 text-sm text-gray-500">
            A cohesive suite of modules designed to handle the complete customer lifecycle from quote to cash.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-2xl flex items-center justify-center mb-4">
                {app.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4BFF] bg-purple-50 px-2 py-0.5 rounded-full">
                {app.category}
              </span>
              <h4 className="font-bold text-base mt-2 text-[#1B1F3B]">{app.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{app.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 text-center text-xs text-gray-400">
        <p>© 2026 Brightloop Software Ltd. LoopDesk Subscription Management SaaS.</p>
        <p className="mt-1">Built for Aether Hackathon 2026.</p>
      </footer>
    </div>
  );
};
