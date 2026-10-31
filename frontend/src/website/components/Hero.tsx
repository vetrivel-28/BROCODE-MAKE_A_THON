import React from "react";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "../../shared/components/Button";

interface HeroProps {
  onStartTrial: () => void;
  onExploreDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartTrial, onExploreDemo }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Decorative gradient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-gradient-to-tr from-[#6C4BFF]/10 via-[#00C2A8]/10 to-[#FFC93C]/10 blur-3xl opacity-70"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6C4BFF]/20 bg-[#F0EDFF] px-4 py-1.5 text-xs font-bold text-[#6C4BFF] mb-6 shadow-xs animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-3.5 w-3.5 text-[#6C4BFF]" />
          <span>B2B SUBSCRIPTION REVOLUTION</span>
          <span className="h-1 w-1 rounded-full bg-[#6C4BFF]" />
          <span className="text-gray-600 font-medium">Built for Aether Hackathon</span>
        </div>

        {/* Main Headline with handwritten accent */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#1B1F3B] tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Manage recurring revenue{" "}
          <span className="relative inline-block text-[#6C4BFF]">
            <span className="font-handwriting text-5xl sm:text-7xl md:text-8xl text-[#FF7A59] block sm:inline font-bold transform -rotate-2">
              in sync
            </span>
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
          The all-in-one workspace for modern B2B founders: customizable tiers, automated 
          idempotent billing, instant quotations, and live revenue intelligence.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onStartTrial}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="w-full sm:w-auto shadow-lg shadow-[#6C4BFF]/25 hover:shadow-xl hover:shadow-[#6C4BFF]/30"
          >
            Start 14-Day Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onExploreDemo}
            leftIcon={<Zap className="h-4 w-4 text-[#FF7A59]" />}
            className="w-full sm:w-auto"
          >
            Launch Live Demo App
          </Button>
        </div>

        {/* Social Proof & Value Chips */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00C2A8]" />
            <span>Zero Duplicate Billing Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00C2A8]" />
            <span>Instant Workspace Customization</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#6C4BFF]" />
            <span>Role-Based Multi-Tenant Architecture</span>
          </div>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-[#E9EAF2] bg-white p-3 sm:p-5 shadow-2xl shadow-indigo-950/10 transition-all hover:border-[#6C4BFF]/30">
          <div className="rounded-2xl bg-[#F7F8FC] border border-[#E9EAF2] p-4 sm:p-6 text-left">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9EAF2] mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-bold text-gray-500">
                  loopdesk.cloud / acme-corp / control-room
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#00C2A8] bg-[#00C2A8]/10 px-2.5 py-1 rounded-full">
                  ● Idempotent Engine Active
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="rounded-xl bg-white p-3 border border-[#E9EAF2] shadow-xs">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Monthly RR</p>
                <p className="text-xl font-bold text-[#1B1F3B] mt-0.5">₹2,84,500</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ 18.4% vs last mo</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-[#E9EAF2] shadow-xs">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Active Subs</p>
                <p className="text-xl font-bold text-[#6C4BFF] mt-0.5">412</p>
                <p className="text-[10px] text-gray-500 font-medium mt-1">across 3 tiers</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-[#E9EAF2] shadow-xs">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Billing Health</p>
                <p className="text-xl font-bold text-[#00C2A8] mt-0.5">99.8%</p>
                <p className="text-[10px] text-teal-600 font-bold mt-1">0 missed cycles</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-[#E9EAF2] shadow-xs">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Slots Used</p>
                <p className="text-xl font-bold text-[#FF7A59] mt-0.5">7 / 10</p>
                <p className="text-[10px] text-orange-600 font-medium mt-1">Custom Tier</p>
              </div>
            </div>

            {/* Banner preview */}
            <div className="rounded-xl bg-gradient-to-r from-[#6C4BFF] to-[#8C6BFF] p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-5 w-5 text-[#FFC93C]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Billing Day Control Room</h4>
                  <p className="text-xs text-white/80">Batch #BR-2026-10: 412 processed, 0 skipped, 0 failed</p>
                </div>
              </div>
              <button
                onClick={onExploreDemo}
                className="px-3.5 py-1.5 bg-white text-[#6C4BFF] text-xs font-bold rounded-lg shadow-xs hover:bg-gray-50 transition-colors"
              >
                Inspect Live Run →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
