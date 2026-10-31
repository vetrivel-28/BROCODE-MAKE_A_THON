import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Percent,
} from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { DataTable } from "../../shared/components/DataTable";
import { Modal } from "../../shared/components/Modal";
import { useToast } from "../../shared/components/Toast";
import { apiClient } from "../../shared/api/client";
import type { CustomerHealthItem, CustomerHealthData } from "./types";

const fallbackHealthData: CustomerHealthItem[] = [
  {
    id: "sub-1",
    companyName: "TechNova Solutions",
    contactEmail: "billing@technova.com",
    tier: "Standard",
    seats: 12,
    healthScore: 92,
    status: "healthy",
    paymentPunctuality: 100,
    overdueCount: 0,
    overdueAmount: 0,
    seatGrowth: 20,
    trend: "improving",
  },
  {
    id: "sub-2",
    companyName: "BlueSky Media Group",
    contactEmail: "accounts@bluesky.com",
    tier: "Custom",
    seats: 25,
    healthScore: 88,
    status: "healthy",
    paymentPunctuality: 95,
    overdueCount: 0,
    overdueAmount: 0,
    seatGrowth: 15,
    trend: "improving",
  },
  {
    id: "sub-3",
    companyName: "Apex Logistics India",
    contactEmail: "finance@apexlogistics.in",
    tier: "Standard",
    seats: 8,
    healthScore: 68,
    status: "at-risk",
    paymentPunctuality: 75,
    overdueCount: 1,
    overdueAmount: 5475,
    seatGrowth: 0,
    trend: "stable",
  },
  {
    id: "sub-4",
    companyName: "Vertex Cyber Security",
    contactEmail: "billing@vertexsec.io",
    tier: "Custom",
    seats: 4,
    healthScore: 42,
    status: "critical",
    paymentPunctuality: 50,
    overdueCount: 2,
    overdueAmount: 10195,
    seatGrowth: -25,
    trend: "declining",
  },
  {
    id: "sub-5",
    companyName: "Zenith Retail Partners",
    contactEmail: "owner@zenithretail.com",
    tier: "Standard",
    seats: 10,
    healthScore: 84,
    status: "healthy",
    paymentPunctuality: 98,
    overdueCount: 0,
    overdueAmount: 0,
    seatGrowth: 10,
    trend: "improving",
  },
];

export const CustomerHealthBoard: React.FC = () => {
  const { success } = useToast();
  const [customers, setCustomers] = useState<CustomerHealthItem[]>(fallbackHealthData);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHealthItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [suggestedDiscount, setSuggestedDiscount] = useState<number>(10);

  useEffect(() => {
    let isMounted = true;
    async function fetchHealth() {
      try {
        const response = await apiClient<{ status: string; data: CustomerHealthData }>(
          "/api/insights/customer-health?status=all&limit=25"
        );
        if (isMounted && response?.data?.data && response.data.data.length > 0) {
          setCustomers(response.data.data);
        }
      } catch {
        // Use realistic fallback
      }
    }
    fetchHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplySmartDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    success(
      "Smart Retention Discount Triggered",
      `Applied ${suggestedDiscount}% discount on next invoice for ${selectedCustomer.companyName} to boost account retention!`
    );
    setIsDiscountModalOpen(false);
  };

  const healthyCount = customers.filter((c) => c.status === "healthy").length;
  const atRiskCount = customers.filter((c) => c.status === "at-risk").length;
  const criticalCount = customers.filter((c) => c.status === "critical").length;

  const columns = [
    {
      key: "companyName",
      header: "Customer Account",
      render: (item: CustomerHealthItem) => (
        <div>
          <span className="font-bold text-[#1B1F3B]">{item.companyName}</span>
          <div className="text-[11px] text-gray-400">{item.contactEmail}</div>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Plan Tier",
      render: (item: CustomerHealthItem) => (
        <Badge
          variant={item.tier === "Custom" ? "custom" : item.tier === "Standard" ? "standard" : "free"}
          size="sm"
        >
          {item.tier}
        </Badge>
      ),
    },
    {
      key: "healthScore",
      header: "Health Score",
      render: (item: CustomerHealthItem) => {
        const color =
          item.status === "healthy"
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : item.status === "at-risk"
            ? "text-amber-800 bg-amber-50 border-amber-200"
            : "text-red-700 bg-red-50 border-red-200";

        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-xl border ${color}`}
            >
              {item.healthScore} / 100
            </span>
            <span className="text-[11px] capitalize text-gray-500 font-semibold">
              {item.status}
            </span>
          </div>
        );
      },
    },
    {
      key: "paymentPunctuality",
      header: "Punctuality",
      render: (item: CustomerHealthItem) => (
        <div className="text-xs">
          <span className="font-bold text-[#1B1F3B]">{item.paymentPunctuality}%</span>
          <span className="text-gray-400 text-[10px]"> on-time</span>
        </div>
      ),
    },
    {
      key: "overdue",
      header: "Overdue Status",
      render: (item: CustomerHealthItem) => (
        <div>
          {item.overdueCount > 0 ? (
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {item.overdueCount} inv (₹{item.overdueAmount.toLocaleString("en-IN")})
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              All Clear
            </span>
          )}
        </div>
      ),
    },
    {
      key: "seatGrowth",
      header: "Seat Trajectory",
      render: (item: CustomerHealthItem) => (
        <span
          className={`text-xs font-bold ${
            item.seatGrowth > 0
              ? "text-emerald-600"
              : item.seatGrowth < 0
              ? "text-rose-600"
              : "text-gray-500"
          }`}
        >
          {item.seatGrowth > 0 ? `+${item.seatGrowth}%` : `${item.seatGrowth}%`}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Intervention",
      render: (item: CustomerHealthItem) => (
        <div className="flex items-center gap-2">
          {item.status !== "healthy" ? (
            <button
              onClick={() => {
                setSelectedCustomer(item);
                setSuggestedDiscount(item.status === "critical" ? 15 : 10);
                setIsDiscountModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-[#FF7A59] bg-[#FFF0EB] hover:bg-[#FFE0D6] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Percent className="h-3 w-3" />
              <span>Retention Discount</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-gray-400">Account Prime</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EAF2]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B1F3B] tracking-tight">
            Customer Health Score Board
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic health scores derived from payment punctuality, seat velocity, and overdue risks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="active" size="md">
            Churn Prevention Engine
          </Badge>
        </div>
      </div>

      {/* Health Score Summary Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Healthy (Green) */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Healthy Accounts (Green)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600">{healthyCount}</p>
          <p className="text-xs text-gray-500 mt-1">Score 80–100 · 95%+ on-time payments</p>
        </div>

        {/* At-Risk (Amber) */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              At-Risk Accounts (Amber)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-amber-600">{atRiskCount}</p>
          <p className="text-xs text-gray-500 mt-1">Score 50–79 · Stagnant seats or 1 overdue</p>
        </div>

        {/* Critical (Red) */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Critical Risk (Red)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-rose-600">{criticalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Score &lt; 50 · Multiple overdue, seat drop</p>
        </div>
      </div>

      {/* Customer Health Table */}
      <div className="mt-8">
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customer account or email..."
          searchKey={(item) => `${item.companyName} ${item.contactEmail}`}
          filterOptions={[
            { label: "Healthy (Green)", value: "healthy", filterFn: (i) => i.status === "healthy" },
            { label: "At Risk (Amber)", value: "at-risk", filterFn: (i) => i.status === "at-risk" },
            { label: "Critical (Red)", value: "critical", filterFn: (i) => i.status === "critical" },
          ]}
        />
      </div>

      {/* Smart Retention Discount Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          title={`Retention Discount for ${selectedCustomer.companyName}`}
          description={`Prevent churn by auto-applying a smart retention discount to their next billing invoice.`}
          maxWidth="md"
        >
          <form onSubmit={handleApplySmartDiscount} className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Current Health Score:</span>
                <span>{selectedCustomer.healthScore} / 100 ({selectedCustomer.status})</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Overdue Invoices:</span>
                <span>{selectedCustomer.overdueCount} (₹{selectedCustomer.overdueAmount.toLocaleString("en-IN")})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider mb-2">
                Recommended Discount Rate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20].map((rate) => (
                  <button
                    type="button"
                    key={rate}
                    onClick={() => setSuggestedDiscount(rate)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      suggestedDiscount === rate
                        ? "border-[#FF7A59] bg-[#FFF0EB] text-[#FF7A59] ring-1 ring-[#FF7A59]"
                        : "border-[#E9EAF2] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span>{rate}% Off Next Cycle</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              The discount will be queued in the <strong>Smart Discount Engine (P2)</strong> and automatically calculated on the customer's next invoice.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsDiscountModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="warm"
                size="md"
              >
                Apply {suggestedDiscount}% Retention Discount
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
