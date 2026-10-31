import React, { useState } from "react";
import {
  BarChart3,
  Users2,
  Palette,
  Sparkles,
  ShieldAlert,
  Layers,
  FileCheck2,
  Repeat,
  Receipt,
  Clock,
  Globe2,
  Search,
  Lock,
  ArrowUpRight,
} from "lucide-react";

export interface LauncherApp {
  id: string;
  name: string;
  category: "Revenue & Analytics" | "Operations" | "Finance" | "System";
  icon: React.ReactNode;
  description: string;
  badge?: string;
  badgeColor?: string;
  minTier?: "free" | "standard" | "custom";
  allowedRoles?: ("SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER")[];
}

interface LauncherGridProps {
  currentTier: "free" | "standard" | "custom";
  currentRole: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
  onSelectApp: (appId: string) => void;
  onUpgradePrompt?: () => void;
}

export const LauncherGrid: React.FC<LauncherGridProps> = ({
  currentTier,
  currentRole,
  onSelectApp,
  onUpgradePrompt,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const apps: LauncherApp[] = [
    {
      id: "insights-dashboard",
      name: "Revenue Intelligence",
      category: "Revenue & Analytics",
      icon: <BarChart3 className="h-7 w-7 text-white" />,
      description: "MRR, ARR, churn, collections, and 3-month forecast in under 2s.",
      badge: "Person 4",
      badgeColor: "bg-[#6C4BFF] text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "health-board",
      name: "Customer Health Score",
      category: "Revenue & Analytics",
      icon: <Users2 className="h-7 w-7 text-white" />,
      description: "Green, Amber, Red punctuality matrix & seat growth tracking.",
      badge: "Person 4",
      badgeColor: "bg-[#00C2A8] text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "customization-studio",
      name: "Customization Studio",
      category: "System",
      icon: <Palette className="h-7 w-7 text-white" />,
      description: "Interactive workspace customizer with live wallet price meter.",
      badge: "Person 4",
      badgeColor: "bg-[#FF7A59] text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "ask-revenue-ai",
      name: "Ask Your Revenue AI",
      category: "Revenue & Analytics",
      icon: <Sparkles className="h-7 w-7 text-white" />,
      description: "Natural language query assistant over tenant subscription data.",
      badge: "Custom Tier",
      badgeColor: "bg-[#FFC93C] text-amber-950",
      minTier: "custom",
      allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "privilege-passport",
      name: "Privilege Passport",
      category: "System",
      icon: <ShieldAlert className="h-7 w-7 text-white" />,
      description: "View unlocked privileges, slot allowances, and tier limits.",
      badge: "Person 1",
      badgeColor: "bg-indigo-600 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "subscriptions",
      name: "Subscriptions Lifecycle",
      category: "Operations",
      icon: <Repeat className="h-7 w-7 text-white" />,
      description: "Draft → Quotation → Confirmed → Active → Closed state machine.",
      badge: "Person 2",
      badgeColor: "bg-blue-600 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "quotations",
      name: "Quotations & Templates",
      category: "Operations",
      icon: <FileCheck2 className="h-7 w-7 text-white" />,
      description: "One-click quotes with validity periods & variant pricing.",
      badge: "Person 2",
      badgeColor: "bg-blue-500 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "catalog-plans",
      name: "Product & Plan Catalog",
      category: "Operations",
      icon: <Layers className="h-7 w-7 text-white" />,
      description: "Product variants, billing cadence, and pausable/closable rules.",
      badge: "Person 2",
      badgeColor: "bg-cyan-600 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "control-room",
      name: "Billing Day Control Room",
      category: "Finance",
      icon: <Receipt className="h-7 w-7 text-white" />,
      description: "Idempotent batch billing runs: zero double charges with retry.",
      badge: "Person 3",
      badgeColor: "bg-emerald-600 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "invoices-dunning",
      name: "Invoices & Autopilot Dunning",
      category: "Finance",
      icon: <Clock className="h-7 w-7 text-white" />,
      description: "Day 1, 3, 7, 14 reminder schedules with Revenue at Risk flags.",
      badge: "Person 3",
      badgeColor: "bg-emerald-500 text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    },
    {
      id: "portal-subs",
      name: "Customer Subscriptions",
      category: "Operations",
      icon: <Globe2 className="h-7 w-7 text-white" />,
      description: "Self-service customer portal: view plans, change seats, pause.",
      badge: "Portal",
      badgeColor: "bg-[#00C2A8] text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"],
    },
    {
      id: "portal-invoices",
      name: "Customer Invoices",
      category: "Finance",
      icon: <Receipt className="h-7 w-7 text-white" />,
      description: "Customer self-service: download PDF invoices & settle payments.",
      badge: "Portal",
      badgeColor: "bg-[#6C4BFF] text-white",
      allowedRoles: ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"],
    },
  ];

  // Category list
  const categories = ["All", "Revenue & Analytics", "Operations", "Finance", "System"];

  // Filter apps
  const filteredApps = apps.filter((app) => {
    // Role check
    const roleAllowed = !app.allowedRoles || app.allowedRoles.includes(currentRole);
    // Search match
    const searchMatch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    // Category match
    const categoryMatch = activeCategory === "All" || app.category === activeCategory;

    return roleAllowed && searchMatch && categoryMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header & Launcher Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-[#E9EAF2]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1F3B] tracking-tight">
            App Launcher
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Modular business apps enabled for your <strong>{currentTier.toUpperCase()}</strong> workspace.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search apps & modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E9EAF2] bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1B1F3B] placeholder-gray-400 outline-none focus:border-[#6C4BFF] focus:ring-2 focus:ring-[#6C4BFF]/10 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-[#6C4BFF] text-white shadow-xs"
                : "bg-white text-gray-600 border border-[#E9EAF2] hover:border-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Launcher Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredApps.map((app) => {
          // Check if app is locked by tier (e.g. Ask AI requires Custom tier)
          const isTierLocked = app.minTier === "custom" && currentTier !== "custom";

          // Gradient backgrounds for tiles
          const gradientStyle =
            app.category === "Revenue & Analytics"
              ? "bg-gradient-to-br from-[#6C4BFF] to-[#8C6BFF]"
              : app.category === "Finance"
              ? "bg-gradient-to-br from-[#00C2A8] to-[#009B86]"
              : app.category === "Operations"
              ? "bg-gradient-to-br from-[#FF7A59] to-[#E66847]"
              : "bg-gradient-to-br from-[#1B1F3B] to-[#3B4268]";

          return (
            <div
              key={app.id}
              onClick={() => {
                if (isTierLocked) {
                  onUpgradePrompt && onUpgradePrompt();
                } else {
                  onSelectApp(app.id);
                }
              }}
              className={`group relative rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 cursor-pointer ${
                isTierLocked
                  ? "border-dashed border-amber-300 bg-amber-50/20 opacity-80 hover:opacity-100"
                  : "border-[#E9EAF2] hover:border-[#6C4BFF]/40 hover:shadow-lg hover:-translate-y-1"
              }`}
            >
              <div className="flex items-start justify-between">
                {/* App Tile Icon */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105 ${gradientStyle}`}
                >
                  {app.icon}
                </div>

                {/* Badge or Lock */}
                {isTierLocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Lock className="h-3 w-3" />
                    Custom Tier
                  </span>
                ) : (
                  app.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${app.badgeColor}`}
                    >
                      {app.badge}
                    </span>
                  )
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1B1F3B] group-hover:text-[#6C4BFF] transition-colors">
                    {app.name}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-[#6C4BFF] transition-all" />
                </div>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {app.description}
                </p>
              </div>

              {/* Category indicator footer */}
              <div className="mt-4 pt-3 border-t border-[#E9EAF2]/60 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <span>{app.category}</span>
                {isTierLocked ? (
                  <span className="text-amber-700 font-bold hover:underline">Upgrade to Unlock</span>
                ) : (
                  <span className="text-[#6C4BFF] font-bold group-hover:translate-x-0.5 transition-transform">Open →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
