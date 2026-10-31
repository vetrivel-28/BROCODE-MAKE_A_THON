import React, { useState } from "react";
import {
  Repeat,
  Users,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Modal } from "../../shared/components/Modal";
import { Input } from "../../shared/components/Input";
import { useToast } from "../../shared/components/Toast";
import { DataTable } from "../../shared/components/DataTable";

export interface SubscriptionRecord {
  id: string;
  subNumber: string;
  planName: string;
  tier: "Free" | "Standard" | "Custom";
  seats: number;
  unitPrice: number;
  billingPeriod: "Monthly" | "Yearly";
  startDate: string;
  nextRenewal: string;
  status: "Active" | "Paused" | "Closed";
}

const mockSubscriptions: SubscriptionRecord[] = [
  {
    id: "sub-1",
    subNumber: "SUB-2026-001",
    planName: "B2B Pro Tier",
    tier: "Standard",
    seats: 12,
    unitPrice: 580,
    billingPeriod: "Monthly",
    startDate: "2026-01-15",
    nextRenewal: "2026-11-15",
    status: "Active",
  },
  {
    id: "sub-2",
    subNumber: "SUB-2026-002",
    planName: "Developer API Suite",
    tier: "Custom",
    seats: 5,
    unitPrice: 1080,
    billingPeriod: "Monthly",
    startDate: "2026-03-01",
    nextRenewal: "2026-11-01",
    status: "Active",
  },
  {
    id: "sub-3",
    subNumber: "SUB-2026-003",
    planName: "Branded Invoice Module",
    tier: "Standard",
    seats: 1,
    unitPrice: 350,
    billingPeriod: "Monthly",
    startDate: "2026-05-10",
    nextRenewal: "2026-11-10",
    status: "Paused",
  },
];

export const CustomerSubscriptions: React.FC = () => {
  const { success, info } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(mockSubscriptions);
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [isSeatsModalOpen, setIsSeatsModalOpen] = useState(false);
  const [newSeatCount, setNewSeatCount] = useState<number>(1);

  const handleOpenSeatModal = (sub: SubscriptionRecord) => {
    setSelectedSub(sub);
    setNewSeatCount(sub.seats);
    setIsSeatsModalOpen(true);
  };

  const handleUpdateSeats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    if (newSeatCount < 1) {
      return;
    }

    setSubscriptions((prev) =>
      prev.map((s) => (s.id === selectedSub.id ? { ...s, seats: newSeatCount } : s))
    );

    success(
      "Seats Updated Successfully",
      `${selectedSub.subNumber} updated to ${newSeatCount} seats (New Monthly: ₹${(
        newSeatCount * selectedSub.unitPrice
      ).toLocaleString("en-IN")})`
    );
    setIsSeatsModalOpen(false);
  };

  const handleTogglePause = (sub: SubscriptionRecord) => {
    const nextStatus = sub.status === "Active" ? "Paused" : "Active";
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s))
    );

    if (nextStatus === "Paused") {
      info(
        "Subscription Paused",
        `${sub.subNumber} paused. Auto-renewals paused until resumed.`
      );
    } else {
      success(
        "Subscription Resumed",
        `${sub.subNumber} reactivated. Next billing cycle on ${sub.nextRenewal}.`
      );
    }
  };

  // Metrics
  const activeSubs = subscriptions.filter((s) => s.status === "Active");
  const totalSeats = activeSubs.reduce((acc, curr) => acc + curr.seats, 0);
  const totalSpend = activeSubs.reduce((acc, curr) => acc + curr.seats * curr.unitPrice, 0);

  const columns = [
    {
      key: "subNumber",
      header: "Subscription #",
      render: (item: SubscriptionRecord) => (
        <div>
          <span className="font-bold text-[#6C4BFF]">{item.subNumber}</span>
          <div className="text-[11px] text-gray-400">{item.planName}</div>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (item: SubscriptionRecord) => (
        <Badge
          variant={item.tier === "Custom" ? "custom" : item.tier === "Standard" ? "standard" : "free"}
          size="sm"
        >
          {item.tier}
        </Badge>
      ),
    },
    {
      key: "seats",
      header: "Seats",
      render: (item: SubscriptionRecord) => (
        <span className="font-semibold text-gray-700">{item.seats} seats</span>
      ),
    },
    {
      key: "amount",
      header: "Billing Amount",
      render: (item: SubscriptionRecord) => (
        <div>
          <span className="font-bold text-[#1B1F3B]">
            ₹{(item.seats * item.unitPrice).toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-gray-400 font-normal"> / {item.billingPeriod.toLowerCase()}</span>
        </div>
      ),
    },
    {
      key: "nextRenewal",
      header: "Next Renewal",
      render: (item: SubscriptionRecord) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{item.nextRenewal}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: SubscriptionRecord) => (
        <Badge
          variant={
            item.status === "Active"
              ? "active"
              : item.status === "Paused"
              ? "paused"
              : "closed"
          }
          size="sm"
          dot
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: SubscriptionRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenSeatModal(item)}
            className="px-2.5 py-1 text-xs font-bold text-[#6C4BFF] bg-[#F0EDFF] hover:bg-[#E5E0FF] rounded-lg transition-colors cursor-pointer"
          >
            Change Seats
          </button>
          <button
            onClick={() => handleTogglePause(item)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              item.status === "Active"
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            }`}
            title={item.status === "Active" ? "Pause Subscription" : "Resume Subscription"}
          >
            {item.status === "Active" ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
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
            My Subscriptions
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your active recurring plans, adjust user licenses, or pause cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="paid" size="md">
            Customer Self-Service Portal
          </Badge>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>ACTIVE PLANS</span>
            <Repeat className="h-4 w-4 text-[#6C4BFF]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1B1F3B]">{activeSubs.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Recurring on standard cycle</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>ALLOCATED SEATS</span>
            <Users className="h-4 w-4 text-[#00C2A8]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1B1F3B]">{totalSeats}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            +3 seats added this quarter
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>MONTHLY RUN RATE</span>
            <Sparkles className="h-4 w-4 text-[#FF7A59]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1B1F3B]">
            ₹{totalSpend.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Automated billing on due date</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="mt-8">
        <DataTable
          columns={columns}
          data={subscriptions}
          searchPlaceholder="Search subscription number or plan..."
          searchKey={(item) => `${item.subNumber} ${item.planName}`}
          filterOptions={[
            { label: "Active", value: "active", filterFn: (i) => i.status === "Active" },
            { label: "Paused", value: "paused", filterFn: (i) => i.status === "Paused" },
          ]}
        />
      </div>

      {/* Change Seats Modal */}
      {selectedSub && (
        <Modal
          isOpen={isSeatsModalOpen}
          onClose={() => setIsSeatsModalOpen(false)}
          title={`Adjust Seats for ${selectedSub.subNumber}`}
          description={`Update team seat allocation for "${selectedSub.planName}".`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateSeats} className="space-y-4">
            <div className="rounded-xl bg-[#F7F8FC] p-4 border border-[#E9EAF2] space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Unit Price per Seat:</span>
                <span className="font-bold text-[#1B1F3B]">
                  ₹{selectedSub.unitPrice} / mo
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Current Seat Count:</span>
                <span className="font-bold text-[#6C4BFF]">{selectedSub.seats} seats</span>
              </div>
            </div>

            <Input
              label="New Total Seats"
              type="number"
              min="1"
              max="500"
              value={newSeatCount}
              onChange={(e) => setNewSeatCount(parseInt(e.target.value) || 1)}
              required
              helperText="Changes take effect immediately on your upcoming invoice."
            />

            {/* Smart discount suggestion hint */}
            {newSeatCount >= 15 && selectedSub.seats < 15 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Volume Unlock:</strong> 15+ seats qualify for our 10% volume discount on your next invoice!
                </span>
              </div>
            )}

            <div className="rounded-xl bg-[#F0EDFF] p-4 text-xs flex justify-between items-center font-bold text-[#6C4BFF]">
              <span>New Monthly Total:</span>
              <span className="text-base font-black">
                ₹{(newSeatCount * selectedSub.unitPrice).toLocaleString("en-IN")} / mo
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsSeatsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm New Seats
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
