import React, { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "../../shared/components/Button";
import { Badge } from "../../shared/components/Badge";

interface PricingSectionProps {
  onSelectTier: (tier: "free" | "standard" | "custom") => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectTier }) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const isYearly = billingCycle === "yearly";

  return (
    <section id="pricing" className="py-20 bg-white border-y border-[#E9EAF2] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto">
          <Badge variant="standard" size="md">
            TRANSPARENT VALUE
          </Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
            Predictable pricing that grows with your business
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500">
            Pick a tier, unlock customization slots, and manage recurring revenue with zero friction.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center rounded-xl bg-[#F7F8FC] p-1.5 border border-[#E9EAF2] shadow-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                !isYearly
                  ? "bg-white text-[#1B1F3B] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isYearly
                  ? "bg-[#6C4BFF] text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isYearly ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
          {/* TIER 1: Free ₹0 */}
          <div className="rounded-3xl border border-[#E9EAF2] bg-[#F7F8FC]/60 p-8 flex flex-col justify-between transition-all hover:border-gray-300 hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Starter
                </span>
                <span className="text-[11px] font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-full">
                  Fixed Template
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-black text-[#1B1F3B]">Free</h3>
              <p className="mt-1 text-xs text-gray-500">
                Single app access to launch your first subscription workflow.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1B1F3B]">₹0</span>
                <span className="text-xs text-gray-500 font-medium">/ month forever</span>
              </div>

              <div className="mt-6 border-t border-[#E9EAF2] pt-6 space-y-3 text-xs text-gray-700">
                <p className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Included Features</p>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>1 App</strong> with unlimited team users</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Fixed default workspace template</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Basic billing & manual invoice sending</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Owner Admin role</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                  <span className="text-gray-400">0 Customization slots</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Standard summary reports</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => onSelectTier("free")}
              >
                Get Started Free
              </Button>
            </div>
          </div>

          {/* TIER 2: Standard ₹580 (POPULAR) */}
          <div className="relative rounded-3xl border-2 border-[#6C4BFF] bg-white p-8 flex flex-col justify-between shadow-xl shadow-[#6C4BFF]/10 transition-all hover:shadow-2xl">
            {/* Popular Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6C4BFF] to-[#8C6BFF] px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
              <Star className="h-3 w-3 fill-current text-[#FFC93C]" />
              <span>Most Popular</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6C4BFF]">
                  Scale
                </span>
                <span className="text-[11px] font-bold text-[#6C4BFF] bg-[#F0EDFF] px-2.5 py-0.5 rounded-full">
                  2 Custom Slots Included
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-black text-[#1B1F3B]">Standard</h3>
              <p className="mt-1 text-xs text-gray-500">
                Complete subscription automation for expanding B2B companies.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1B1F3B]">
                  ₹{isYearly ? 464 : 580}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ user / month</span>
              </div>
              {isYearly && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1">
                  Billed ₹5,568 annually (20% off)
                </p>
              )}

              <div className="mt-6 border-t border-[#E9EAF2] pt-6 space-y-3 text-xs text-gray-700">
                <p className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Everything in Free, plus:</p>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>All core apps</strong> included</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>Fully automated billing</strong> & idempotent runs</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>Autopilot Dunning</strong> (Day 1, 3, 7, 14 reminders)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>2 Customization Slots</strong> included</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Pay-per-customization wallet top-ups</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Interactive revenue dashboard & filters</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => onSelectTier("standard")}
                className="shadow-md shadow-[#6C4BFF]/25"
              >
                Start Standard 14-Day Trial
              </Button>
            </div>
          </div>

          {/* TIER 3: Custom ₹1080 */}
          <div className="rounded-3xl border border-[#E9EAF2] bg-[#F7F8FC]/60 p-8 flex flex-col justify-between transition-all hover:border-[#FFC93C]/60 hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Enterprise Composable
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  10 Slots + AI Assistant
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-black text-[#1B1F3B]">Custom</h3>
              <p className="mt-1 text-xs text-gray-500">
                Compose your exact workspace modules with maximum flexibility.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1B1F3B]">
                  ₹{isYearly ? 864 : 1080}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ user / month</span>
              </div>
              {isYearly && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1">
                  Billed ₹10,368 annually (20% off)
                </p>
              )}

              <div className="mt-6 border-t border-[#E9EAF2] pt-6 space-y-3 text-xs text-gray-700">
                <p className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Everything in Standard, plus:</p>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>All apps + App Marketplace</strong></span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>Custom-composed workspace</strong> (pick any module)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>10 Customization Slots</strong> included</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Discounted bundle of 5 customizations</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span>Advanced custom roles & granular permissions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#00C2A8] shrink-0 mt-0.5" />
                  <span><strong>AI Revenue Assistant</strong> ("Ask your revenue")</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Button
                variant="warm"
                size="md"
                fullWidth
                onClick={() => onSelectTier("custom")}
              >
                Configure Custom Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
