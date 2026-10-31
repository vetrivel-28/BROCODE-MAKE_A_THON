import React, { useState } from "react";
import {
  Globe,
  TrendingUp,
  Headphones,
  Package,
  FileText,
  Repeat,
  Percent,
  Wallet,
  Receipt,
  Users,
  Clock,
  Sparkles,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "../../shared/components/Badge";

interface AppItem {
  id: string;
  name: string;
  category: "Website" | "Sales" | "Finance" | "Services" | "Productivity" | "Supply Chain";
  icon: React.ReactNode;
  badge?: string;
  description: string;
  highlight?: boolean;
}

const appsList: AppItem[] = [
  // Website
  {
    id: "app-portal",
    name: "Customer Portal",
    category: "Website",
    icon: <Globe className="h-6 w-6 text-[#6C4BFF]" />,
    badge: "Core",
    description: "Branded self-service portal for clients to check subscriptions, download invoices, and add seats.",
  },
  {
    id: "app-catalog-web",
    name: "Web Catalog",
    category: "Website",
    icon: <Package className="h-6 w-6 text-[#00C2A8]" />,
    description: "Public-facing pricing table and checkout page with live plan variant selection.",
  },

  // Sales
  {
    id: "app-subs",
    name: "Subscriptions",
    category: "Sales",
    icon: <Repeat className="h-6 w-6 text-[#6C4BFF]" />,
    badge: "Popular",
    description: "End-to-end lifecycle machine: Draft → Quotation → Confirmed → Active → Closed.",
    highlight: true,
  },
  {
    id: "app-quotes",
    name: "Quotations & Templates",
    category: "Sales",
    icon: <FileText className="h-6 w-6 text-[#FF7A59]" />,
    description: "One-click quotation generator with validity days, product variants, and preset terms.",
  },
  {
    id: "app-discounts",
    name: "Smart Discount Engine",
    category: "Sales",
    icon: <Percent className="h-6 w-6 text-[#FFC93C]" />,
    badge: "AI Powered",
    description: "Auto-applies discounts on next invoice with usage limits and seat-growth upsells.",
  },

  // Finance
  {
    id: "app-billing",
    name: "Billing Day Control Room",
    category: "Finance",
    icon: <Receipt className="h-6 w-6 text-[#6C4BFF]" />,
    badge: "Unique",
    description: "Idempotent batch billing runs: zero double charges, instant failure retry, live progress.",
    highlight: true,
  },
  {
    id: "app-wallet",
    name: "Customization Wallet",
    category: "Finance",
    icon: <Wallet className="h-6 w-6 text-[#00C2A8]" />,
    description: "Pre-funded wallet for on-demand template branding, custom fields, and bundle purchases.",
  },
  {
    id: "app-dunning",
    name: "Autopilot Dunning",
    category: "Finance",
    icon: <Clock className="h-6 w-6 text-[#FF7A59]" />,
    description: "Day 1, 3, 7, 14 automated reminder schedules with live Revenue at Risk tracking.",
  },

  // Services
  {
    id: "app-health",
    name: "Customer Health Score",
    category: "Services",
    icon: <Users className="h-6 w-6 text-[#00C2A8]" />,
    badge: "Unique",
    description: "Dynamic Green, Amber, Red health scores derived from punctuality, seat growth, and risk.",
  },
  {
    id: "app-helpdesk",
    name: "Subscription Support",
    category: "Services",
    icon: <Headphones className="h-6 w-6 text-[#6C4BFF]" />,
    description: "Direct ticketing for plan changes, invoice inquiries, and seat upgrades.",
  },

  // Productivity
  {
    id: "app-revenue-ai",
    name: "Ask Your Revenue AI",
    category: "Productivity",
    icon: <Sparkles className="h-6 w-6 text-[#FFC93C]" />,
    badge: "Custom Tier",
    description: "LLM chat assistant answering: 'Which invoices are overdue this month?' over your data.",
    highlight: true,
  },
  {
    id: "app-timeline",
    name: "Subscription Timeline",
    category: "Productivity",
    icon: <TrendingUp className="h-6 w-6 text-[#6C4BFF]" />,
    description: "Audit trail tracking every status change, discount application, and payment receipt.",
  },

  // Supply Chain
  {
    id: "app-inventory",
    name: "Physical Inventory & Bundles",
    category: "Supply Chain",
    icon: <Truck className="h-6 w-6 text-[#FF7A59]" />,
    description: "Track hardware delivery alongside SaaS recurring plans with integrated stock levels.",
  },
];

const categories = [
  "All",
  "Website",
  "Sales",
  "Finance",
  "Services",
  "Productivity",
  "Supply Chain",
] as const;

export const AppShowcase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredApps =
    activeCategory === "All"
      ? appsList
      : appsList.filter((app) => app.category === activeCategory);

  return (
    <section id="showcase" className="py-20 bg-[#F7F8FC]/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Header */}
        <div className="max-w-2xl mx-auto">
          <Badge variant="paid" size="md">
            MODULAR ARCHITECTURE
          </Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
            An ecosystem of apps built for recurring growth
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500">
            Start with the core subscription engine or compose a modular business hub across 6 dimensions.
          </p>

          {/* Category Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#6C4BFF] text-white shadow-md shadow-[#6C4BFF]/20"
                    : "bg-white text-gray-600 border border-[#E9EAF2] hover:border-[#6C4BFF]/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className={`rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                app.highlight
                  ? "border-[#6C4BFF]/40 ring-1 ring-[#6C4BFF]/20"
                  : "border-[#E9EAF2] hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F8FC] border border-[#E9EAF2]/60 shadow-xs">
                  {app.icon}
                </div>
                {app.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      app.badge === "Popular"
                        ? "bg-[#F0EDFF] text-[#6C4BFF]"
                        : app.badge === "Unique"
                        ? "bg-[#E6FAF6] text-[#00C2A8]"
                        : app.badge === "AI Powered"
                        ? "bg-[#FFF8E6] text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {app.badge}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>{app.category}</span>
                </div>
                <h3 className="mt-1 text-base font-bold text-[#1B1F3B]">{app.name}</h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                  {app.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E9EAF2]/60 flex items-center gap-1 text-[11px] font-bold text-[#6C4BFF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00C2A8]" />
                <span>Instant Activation Available</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
