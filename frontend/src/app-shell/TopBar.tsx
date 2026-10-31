import React, { useState } from "react";
import {
  Layers,
  Wallet,
  Bell,
  Sparkles,
  ChevronDown,
  LogOut,
  ExternalLink,
  PlusCircle,
  Building2,
} from "lucide-react";
import { Badge } from "../shared/components/Badge";

export interface TopBarProps {
  workspaceName?: string;
  tier: "free" | "standard" | "custom";
  currentRole: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
  onRoleChange: (role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER") => void;
  walletBalance?: number;
  slotsUsed?: number;
  totalSlots?: number;
  onTopUpWallet: () => void;
  onGoToWebsite: () => void;
  onOpenPassport?: () => void;
  onOpenStudio?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  workspaceName = "Acme SaaS Technologies",
  tier,
  currentRole,
  onRoleChange,
  walletBalance = 4200,
  slotsUsed = 2,
  totalSlots = 10,
  onTopUpWallet,
  onGoToWebsite,
  onOpenPassport,
  onOpenStudio,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Batch Billing Completed", time: "10m ago", desc: "Batch #BR-102 processed 412 active subscriptions with 0 errors." },
    { id: 2, title: "Customization Slot Consumed", time: "1h ago", desc: "Branded Invoice Template activated (-1 slot)." },
    { id: 3, title: "Autopilot Dunning Sent", time: "3h ago", desc: "Day 3 payment reminder dispatched for #INV-0089." },
  ];

  const roleLabels = {
    SUPER_ADMIN: "Platform Super Admin",
    ADMIN: "Tenant Owner (Admin)",
    STAFF: "Tenant Staff",
    CUSTOMER: "Customer Portal",
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E9EAF2] h-16 px-4 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
        {/* Left: Workspace Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToWebsite}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C4BFF] text-white shadow-xs hover:bg-[#5A3BE6] transition-colors cursor-pointer"
            title="LoopDesk Home"
          >
            <Layers className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-black text-[#1B1F3B] flex items-center gap-1.5 leading-tight">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                {workspaceName}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                LoopDesk Workspace
              </span>
            </div>

            <Badge
              variant={tier === "custom" ? "custom" : tier === "standard" ? "standard" : "free"}
              size="sm"
              dot
            >
              {tier.toUpperCase()} TIER
            </Badge>
          </div>
        </div>

        {/* Right: Wallet Balance, Role Switcher, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Customization Wallet & Slots Meter (Visible to Admin & Staff) */}
          {currentRole !== "CUSTOMER" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E9EAF2] bg-[#F7F8FC] text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 font-bold">
                <Wallet className="h-4 w-4 text-[#00C2A8]" />
                <span>₹{walletBalance.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                <Sparkles className="h-3 w-3 text-[#FF7A59]" />
                <span>
                  {slotsUsed}/{totalSlots} slots
                </span>
              </div>
              <button
                onClick={onTopUpWallet}
                className="ml-1 text-[11px] font-bold text-[#6C4BFF] hover:text-[#5A3BE6] flex items-center gap-0.5 cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                Top-up
              </button>
            </div>
          )}

          {/* Role Switcher (For Demo & Testing) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9EAF2] bg-white hover:bg-gray-50 text-xs font-bold text-[#1B1F3B] shadow-xs transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline text-gray-400 font-medium">Role:</span>
              <span className="text-[#6C4BFF]">{currentRole}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E9EAF2] bg-white p-1.5 shadow-xl shadow-gray-900/10 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Switch Active Role (Demo)
                </div>
                {(["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleChange(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      currentRole === r
                        ? "bg-[#F0EDFF] text-[#6C4BFF] font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {currentRole === r && <span className="h-1.5 w-1.5 rounded-full bg-[#6C4BFF]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleMenu(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E9EAF2] bg-white p-3 shadow-xl shadow-gray-900/10 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#E9EAF2] mb-2 px-1">
                  <span className="text-xs font-bold text-[#1B1F3B]">Notifications</span>
                  <span className="text-[10px] font-bold text-[#6C4BFF] bg-[#F0EDFF] px-2 py-0.5 rounded-full">
                    3 new
                  </span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-xl bg-[#F7F8FC] hover:bg-[#F0EDFF]/40 transition-colors text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B1F3B]">{n.title}</span>
                        <span className="text-[10px] text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C4BFF] to-[#00C2A8] text-white text-xs font-bold shadow-xs">
                {currentRole === "CUSTOMER" ? "C" : "AD"}
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E9EAF2] bg-white p-2 shadow-xl shadow-gray-900/10 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="px-3 py-2 border-b border-[#E9EAF2] mb-1">
                  <p className="text-xs font-bold text-[#1B1F3B]">Amrit Kumar</p>
                  <p className="text-[10px] text-gray-500 truncate">owner@acme.com</p>
                </div>

                {onOpenPassport && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenPassport();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#F0EDFF] hover:text-[#6C4BFF] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#6C4BFF]" />
                    <span>Privilege Passport</span>
                  </button>
                )}

                {onOpenStudio && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenStudio();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#F0EDFF] hover:text-[#6C4BFF] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#00C2A8]" />
                    <span>Customization Studio</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onGoToWebsite();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  <span>Public Landing Page</span>
                </button>

                <div className="border-t border-[#E9EAF2] my-1" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onGoToWebsite();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
