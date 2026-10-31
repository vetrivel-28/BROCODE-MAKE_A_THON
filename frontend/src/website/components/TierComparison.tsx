import React, { useState } from "react";
import { Check, Minus, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface ComparisonRow {
  name: string;
  description: string;
  free: string | boolean;
  standard: string | boolean;
  custom: string | boolean;
}

interface ComparisonCategory {
  category: string;
  rows: ComparisonRow[];
}

const comparisonData: ComparisonCategory[] = [
  {
    category: "Workspace & Modules",
    rows: [
      {
        name: "Included Apps",
        description: "Number of modular business apps enabled in your workspace",
        free: "1 app (unlimited users)",
        standard: "All core apps",
        custom: "All apps + App Marketplace",
      },
      {
        name: "Workspace Look & Layout",
        description: "Visual workspace theme and modular layout options",
        free: "Fixed template",
        standard: "General template",
        custom: "Custom-composed workspace",
      },
      {
        name: "App Modules Available",
        description: "Sales, CRM, eCommerce, Accounting, Inventory, HR, POS, Sign",
        free: false,
        standard: "Core modules",
        custom: "All modules + Custom builds",
      },
    ],
  },
  {
    category: "Billing & Operations",
    rows: [
      {
        name: "Billing Automation",
        description: "Idempotent recurring generation of invoices, taxes, and line items",
        free: "Basic (manual send)",
        standard: "Fully automated",
        custom: "Fully automated + Webhooks",
      },
      {
        name: "Billing Day Control Room",
        description: "One screen progress bar, duplicate protection, failure retries",
        free: false,
        standard: true,
        custom: true,
      },
      {
        name: "Autopilot Dunning",
        description: "Automated reminder schedules (Day 1, 3, 7, 14) with revenue at risk meter",
        free: false,
        standard: true,
        custom: true,
      },
      {
        name: "Smart Discount Engine",
        description: "Auto-apply on next invoice, usage limits, and seat growth suggestions",
        free: "Manual only",
        standard: true,
        custom: true,
      },
    ],
  },
  {
    category: "Customization & Wallet",
    rows: [
      {
        name: "Included Customization Slots",
        description: "Base slots for custom templates, custom fields, and branded widgets",
        free: "0 slots",
        standard: "2 slots",
        custom: "10 slots",
      },
      {
        name: "Extra Customization Wallet",
        description: "Top-up wallet balance to unlock additional priced customizations",
        free: false,
        standard: "Pay per customization",
        custom: "Pay per item + 5-pack discount",
      },
      {
        name: "Custom Role Permissions",
        description: "Create granular role-based access for tenant staff",
        free: false,
        standard: "Standard roles",
        custom: "Advanced granular RBAC",
      },
    ],
  },
  {
    category: "Analytics & Intelligence",
    rows: [
      {
        name: "Reports & Visuals",
        description: "MRR, ARR, churn, collections, and outstanding invoices",
        free: "Basic summary",
        standard: "Interactive dashboard & filters",
        custom: "Custom dashboards & exports",
      },
      {
        name: "Customer Health Score",
        description: "Punctuality, seat growth, and overdue count (Green, Amber, Red)",
        free: false,
        standard: true,
        custom: true,
      },
      {
        name: "Ask Your Revenue AI",
        description: "Natural language query assistant powered by LLM over tenant data",
        free: false,
        standard: false,
        custom: true,
      },
    ],
  },
];

export const TierComparison: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderValue = (val: string | boolean, highlightColor?: string) => {
    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-4 w-4" />
        </span>
      ) : (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Minus className="h-4 w-4" />
        </span>
      );
    }
    return <span className={`text-xs font-semibold ${highlightColor || "text-[#1B1F3B]"}`}>{val}</span>;
  };

  return (
    <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-[#E9EAF2] bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between pb-6 border-b border-[#E9EAF2]">
        <div className="text-left">
          <h3 className="text-xl font-bold text-[#1B1F3B] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#6C4BFF]" />
            Detailed Tier Feature Comparison
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Compare all capabilities, included slots, and automation privileges.
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6C4BFF] bg-[#F0EDFF] hover:bg-[#E5E0FF] rounded-xl transition-colors cursor-pointer"
        >
          <span>{isExpanded ? "Collapse Matrix" : "Expand Matrix"}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E9EAF2] text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4 w-2/5">Capability</th>
                <th className="py-3 px-4 text-center w-1/5">Free (₹0)</th>
                <th className="py-3 px-4 text-center w-1/5 text-[#6C4BFF]">Standard (₹580)</th>
                <th className="py-3 px-4 text-center w-1/5 text-amber-700">Custom (₹1080)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EAF2]">
              {comparisonData.map((cat) => (
                <React.Fragment key={cat.category}>
                  <tr className="bg-[#F7F8FC]/60">
                    <td
                      colSpan={4}
                      className="py-2.5 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map((row) => (
                    <tr key={row.name} className="hover:bg-[#F7F8FC]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-[#1B1F3B]">{row.name}</div>
                        <div className="text-[11px] text-gray-500">{row.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">{renderValue(row.free)}</td>
                      <td className="py-3.5 px-4 text-center bg-[#F0EDFF]/20">
                        {renderValue(row.standard, "text-[#6C4BFF]")}
                      </td>
                      <td className="py-3.5 px-4 text-center bg-amber-50/20">
                        {renderValue(row.custom, "text-amber-800")}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
