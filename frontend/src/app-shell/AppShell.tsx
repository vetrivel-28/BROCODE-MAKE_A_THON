import React, { useState } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { TopBar } from "./TopBar";
import { TrialBanner } from "./TrialBanner";
import { LauncherGrid } from "./LauncherGrid";
import { CustomerSubscriptions } from "./portal/CustomerSubscriptions";
import { CustomerInvoices } from "./portal/CustomerInvoices";
import { useToast } from "../shared/components/Toast";
import { RevenueDashboard } from "../features/insights/RevenueDashboard";
import { CustomerHealthBoard } from "../features/insights/CustomerHealthBoard";
import { CustomizationStudio } from "../features/insights/CustomizationStudio";
import { AskRevenueChat } from "../features/insights/AskRevenueChat";

export interface AppShellProps {
  initialTier?: "free" | "standard" | "custom";
  initialRole?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
  onGoToWebsite: () => void;
  // Slots for Phase 4 modules
  renderInsightsDashboard?: () => React.ReactNode;
  renderHealthBoard?: () => React.ReactNode;
  renderCustomizationStudio?: () => React.ReactNode;
  renderAskRevenueAi?: () => React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  initialTier = "standard",
  initialRole = "ADMIN",
  onGoToWebsite,
  renderInsightsDashboard,
  renderHealthBoard,
  renderCustomizationStudio,
  renderAskRevenueAi,
}) => {
  const { info, success } = useToast();
  const [tier, setTier] = useState<"free" | "standard" | "custom">(initialTier);
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER">(initialRole);
  const [activeApp, setActiveApp] = useState<string>("launcher");
  const [walletBalance, setWalletBalance] = useState<number>(4200);
  const [slotsUsed] = useState<number>(2);

  const totalSlots = tier === "custom" ? 10 : tier === "standard" ? 2 : 0;

  const handleTopUpWallet = () => {
    setWalletBalance((prev) => prev + 2500);
    success("Wallet Top-Up Successful", "Added ₹2,500 credits to your Customization Wallet.");
  };

  const handleUpgradePrompt = () => {
    info(
      "Tier Upgrade Nudge",
      "Upgrade to Custom Tier (₹1080/user/mo) to unlock 10 customization slots, app marketplace & AI assistant."
    );
  };

  const getAppName = (appId: string) => {
    const map: Record<string, string> = {
      launcher: "App Launcher",
      "insights-dashboard": "Revenue Intelligence",
      "health-board": "Customer Health Score",
      "customization-studio": "Customization Studio",
      "ask-revenue-ai": "Ask Your Revenue AI",
      "portal-subs": "Customer Subscriptions",
      "portal-invoices": "Customer Invoices",
      "privilege-passport": "Privilege Passport",
      subscriptions: "Subscriptions Lifecycle",
      quotations: "Quotations & Templates",
      "catalog-plans": "Product & Plan Catalog",
      "control-room": "Billing Day Control Room",
      "invoices-dunning": "Invoices & Autopilot Dunning",
    };
    return map[appId] || "Module View";
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] flex flex-col font-sans">
      {/* Top Banner (Trial countdown) */}
      <TrialBanner
        daysLeft={12}
        tier={tier.charAt(0).toUpperCase() + tier.slice(1)}
        onUpgrade={() => {
          setTier("custom");
          success("Workspace Upgraded!", "You are now on the Custom Tier with 10 customization slots & AI Revenue Assistant.");
        }}
      />

      {/* Main TopBar */}
      <TopBar
        tier={tier}
        currentRole={role}
        onRoleChange={(newRole) => {
          setRole(newRole);
          info("Role Switched", `Viewing workspace as ${newRole}.`);
        }}
        walletBalance={walletBalance}
        slotsUsed={slotsUsed}
        totalSlots={totalSlots}
        onTopUpWallet={handleTopUpWallet}
        onGoToWebsite={onGoToWebsite}
        onOpenPassport={() => setActiveApp("privilege-passport")}
        onOpenStudio={() => setActiveApp("customization-studio")}
      />

      {/* Breadcrumb Navigation when inside an app */}
      {activeApp !== "launcher" && (
        <div className="bg-white border-b border-[#E9EAF2] px-4 sm:px-6 py-2.5 text-xs font-semibold text-gray-500 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveApp("launcher")}
                className="flex items-center gap-1 text-[#6C4BFF] hover:text-[#5A3BE6] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Apps</span>
              </button>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <span className="text-[#1B1F3B] font-bold">{getAppName(activeApp)}</span>
            </div>

            <button
              onClick={() => setActiveApp("launcher")}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Close App ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View Outlet */}
      <main className="flex-1">
        {activeApp === "launcher" && (
          <LauncherGrid
            currentTier={tier}
            currentRole={role}
            onSelectApp={(appId) => setActiveApp(appId)}
            onUpgradePrompt={handleUpgradePrompt}
          />
        )}

        {activeApp === "portal-subs" && <CustomerSubscriptions />}

        {activeApp === "portal-invoices" && <CustomerInvoices />}

        {/* Phase 4: Revenue Dashboard */}
        {activeApp === "insights-dashboard" && (
          renderInsightsDashboard ? (
            renderInsightsDashboard()
          ) : (
            <RevenueDashboard
              onOpenAskAi={() => setActiveApp("ask-revenue-ai")}
              onOpenHealthBoard={() => setActiveApp("health-board")}
            />
          )
        )}

        {/* Phase 4: Customer Health Score Board */}
        {activeApp === "health-board" && (
          renderHealthBoard ? (
            renderHealthBoard()
          ) : (
            <CustomerHealthBoard />
          )
        )}

        {/* Phase 4: Customization Studio */}
        {activeApp === "customization-studio" && (
          renderCustomizationStudio ? (
            renderCustomizationStudio()
          ) : (
            <CustomizationStudio currentTier={tier} />
          )
        )}

        {/* Phase 4: Ask Revenue AI Chat */}
        {activeApp === "ask-revenue-ai" && (
          renderAskRevenueAi ? (
            renderAskRevenueAi()
          ) : (
            <AskRevenueChat />
          )
        )}

        {/* Bridge for teammate modules (P1, P2, P3) */}
        {[
          "privilege-passport",
          "subscriptions",
          "quotations",
          "catalog-plans",
          "control-room",
          "invoices-dunning",
        ].includes(activeApp) && (
          <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-2xl border border-[#E9EAF2] text-center shadow-xs">
            <div className="inline-block px-3 py-1 bg-[#F0EDFF] text-[#6C4BFF] text-xs font-bold rounded-full mb-3">
              Monorepo Module Bridge
            </div>
            <h2 className="text-xl font-bold text-[#1B1F3B]">{getAppName(activeApp)}</h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-lg mx-auto">
              This module is owned by your teammate branch (P1/P2/P3). When teammate branches are merged into develop, their feature pages will mount right here seamlessly inside this App Shell!
            </p>
            <button
              onClick={() => setActiveApp("launcher")}
              className="mt-6 px-4 py-2 bg-[#6C4BFF] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#5A3BE6] transition-colors cursor-pointer"
            >
              ← Back to App Launcher
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
