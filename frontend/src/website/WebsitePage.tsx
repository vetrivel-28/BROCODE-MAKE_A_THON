import React, { useState } from "react";
import { Layers, ArrowRight, Zap } from "lucide-react";
import { Hero } from "./components/Hero";
import { PricingSection } from "./components/PricingSection";
import { TierComparison } from "./components/TierComparison";
import { AppShowcase } from "./components/AppShowcase";
import { TrialModal, type TrialFormData } from "./components/TrialModal";
import { Button } from "../shared/components/Button";

interface WebsitePageProps {
  onLaunchApp: (tier?: "free" | "standard" | "custom", role?: "ADMIN" | "STAFF" | "CUSTOMER") => void;
}

export const WebsitePage: React.FC<WebsitePageProps> = ({ onLaunchApp }) => {
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"free" | "standard" | "custom">("standard");

  const handleSelectTier = (tier: "free" | "standard" | "custom") => {
    setSelectedTier(tier);
    setIsTrialOpen(true);
  };

  const handleTrialSuccess = (data: TrialFormData) => {
    onLaunchApp(data.tier, "ADMIN");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] flex flex-col font-sans selection:bg-[#6C4BFF]/20 selection:text-[#6C4BFF]">
      {/* Top Banner Notice */}
      <div className="bg-[#1B1F3B] text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-[#00C2A8] animate-ping" />
        <span>LoopDesk B2B Platform v1.0 is Live</span>
        <span className="text-gray-400">·</span>
        <button
          onClick={() => onLaunchApp("standard", "ADMIN")}
          className="text-[#FFC93C] underline hover:text-white font-bold ml-1 cursor-pointer"
        >
          Explore Live Demo Workspace →
        </button>
      </div>

      {/* Website Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E9EAF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 text-lg font-black tracking-tight text-[#1B1F3B]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C4BFF] text-white shadow-md shadow-[#6C4BFF]/30">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-extrabold leading-none">LoopDesk</span>
              <span className="text-[9px] font-bold tracking-widest text-[#6C4BFF] uppercase mt-0.5">
                Subscription SaaS
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-600">
            <a href="#showcase" className="hover:text-[#6C4BFF] transition-colors">
              App Ecosystem
            </a>
            <a href="#pricing" className="hover:text-[#6C4BFF] transition-colors">
              Pricing & Tiers
            </a>
            <a href="#comparison" className="hover:text-[#6C4BFF] transition-colors">
              Privilege Matrix
            </a>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => onLaunchApp("standard", "CUSTOMER")}
              className="text-gray-600 hover:text-[#00C2A8] transition-colors cursor-pointer"
            >
              Customer Portal
            </button>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLaunchApp("standard", "ADMIN")}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTrialOpen(true)}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              className="shadow-sm shadow-[#6C4BFF]/20"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onStartTrial={() => setIsTrialOpen(true)}
          onExploreDemo={() => onLaunchApp("standard", "ADMIN")}
        />

        {/* Live Metrics Trust Banner */}
        <section className="border-y border-[#E9EAF2] bg-white py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-black text-[#6C4BFF]">100%</p>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  Idempotent Billing
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Zero double charges</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-[#00C2A8]">&lt; 2s</p>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  List & Query Speed
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Optimized SQL aggregates</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-[#FF7A59]">₹0</p>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  Missed Renewals
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Autopilot dunning schedule</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-[#1B1F3B]">4 Roles</p>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
                  Role-Aware Security
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Super Admin to Portal</p>
              </div>
            </div>
          </div>
        </section>

        {/* App Ecosystem Showcase */}
        <AppShowcase />

        {/* Pricing Tiers Section */}
        <PricingSection onSelectTier={handleSelectTier} />

        {/* Tier Comparison Matrix Section */}
        <section id="comparison" className="py-20 bg-[#F7F8FC]/40">
          <TierComparison />
        </section>

        {/* Industry Starter Packs Feature Callout */}
        <section className="py-16 bg-white border-t border-[#E9EAF2]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6FAF6] text-[#00A892] text-xs font-bold mb-3">
              <Zap className="h-3.5 w-3.5 text-[#00C2A8]" />
              <span>Zero-Setup Onboarding</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1B1F3B]">
              Pre-configured Industry Starter Packs
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              Choose your vertical at signup. LoopDesk automatically seeds products, billing intervals, 
              tax rules, and quote templates so you can invoice in under 3 minutes.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { name: "SaaS & Cloud", desc: "Per-seat pricing, monthly/annual tiers, usage overages", color: "border-[#6C4BFF]/30 bg-[#F0EDFF]/30" },
                { name: "Retail & Supply", desc: "Wholesale subscriptions, replenishment cadence, tax rules", color: "border-[#00C2A8]/30 bg-[#E6FAF6]/30" },
                { name: "Gym & Fitness", desc: "Passes, recurring memberships, pause guards, auto-renew", color: "border-[#FF7A59]/30 bg-[#FFF0EB]/30" },
                { name: "Coaching & Agency", desc: "Retainers, hourly blocks, quotation validity milestones", color: "border-[#FFC93C]/40 bg-[#FFF8E6]/30" },
              ].map((pack) => (
                <div key={pack.name} className={`p-5 rounded-2xl border ${pack.color} transition-all hover:shadow-md`}>
                  <h4 className="text-sm font-bold text-[#1B1F3B]">{pack.name}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{pack.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-[#6C4BFF] to-[#8C6BFF] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-3xl font-extrabold tracking-tight">
              Ready to put your subscription revenue in rhythm?
            </h3>
            <p className="mt-2 text-sm text-white/80 max-w-lg mx-auto">
              Join founders scaling with LoopDesk. Pick your tier and launch your custom workspace today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="warm"
                size="lg"
                onClick={() => setIsTrialOpen(true)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Start 14-Day Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onLaunchApp("standard", "ADMIN")}
                className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Explore Live Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Website Footer */}
      <footer className="border-t border-[#E9EAF2] bg-white py-12 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C4BFF] text-white text-xs font-black">
              L
            </div>
            <span className="font-bold text-[#1B1F3B]">LoopDesk</span>
            <span className="text-gray-300">|</span>
            <span>Aether Hackathon Edition</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <span className="text-emerald-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
            <a href="#pricing" className="hover:text-[#6C4BFF]">Tiers</a>
            <a href="#showcase" className="hover:text-[#6C4BFF]">Apps</a>
            <span className="text-gray-400">© 2026 LoopDesk Team.</span>
          </div>
        </div>
      </footer>

      {/* Free Trial Modal */}
      <TrialModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        defaultTier={selectedTier}
        onSuccess={handleTrialSuccess}
      />
    </div>
  );
};
