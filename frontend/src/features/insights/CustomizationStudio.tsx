import React, { useState } from "react";
import {
  Palette,
  Wallet,
  Sparkles,
  Layers,
  Check,
  Plus,
  ShieldCheck,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Input } from "../../shared/components/Input";
import { Modal } from "../../shared/components/Modal";
import { useToast } from "../../shared/components/Toast";
import type { CustomizationItem } from "./types";

interface CustomizationStudioProps {
  currentTier?: "free" | "standard" | "custom";
}

const initialCatalog: CustomizationItem[] = [
  {
    id: "cust-brand-invoice",
    name: "Branded PDF Invoice Template",
    category: "Branding",
    cost: 350,
    slotCost: 1,
    description: "Upload your custom logo, fonts, primary colors, and GST footer signatures.",
    enabled: true,
    includedInTier: "Standard",
  },
  {
    id: "cust-fields-sub",
    name: "Custom Subscription Fields",
    category: "Data Model",
    cost: 350,
    slotCost: 1,
    description: "Add PO number, cost center, and custom CRM metadata fields to contracts.",
    enabled: true,
    includedInTier: "Standard",
  },
  {
    id: "cust-widget-rev",
    name: "Custom Dashboard Metric Widget",
    category: "Analytics",
    cost: 350,
    slotCost: 1,
    description: "Build tailored KPI charts, LTV/CAC calculators, and executive export summaries.",
    enabled: false,
    includedInTier: "Custom",
  },
  {
    id: "cust-automation-rule",
    name: "Custom Dunning Automation Rule",
    category: "Workflows",
    cost: 350,
    slotCost: 1,
    description: "Trigger customized webhook payloads and SMS escalation upon 7-day overdue invoices.",
    enabled: false,
    includedInTier: "Custom",
  },
  {
    id: "cust-role-rbac",
    name: "Custom Role with Granular RBAC",
    category: "Security",
    cost: 350,
    slotCost: 1,
    description: "Define staff roles with view-only invoice access or plan-creation permissions.",
    enabled: false,
    includedInTier: "Custom",
  },
  {
    id: "cust-domain",
    name: "Custom Workspace Domain (billing.yourdomain.com)",
    category: "Branding",
    cost: 500,
    slotCost: 1,
    description: "Connect your custom SSL domain for the customer billing portal.",
    enabled: false,
    includedInTier: "None",
  },
];

export const CustomizationStudio: React.FC<CustomizationStudioProps> = ({
  currentTier = "standard",
}) => {
  const { success, error, info } = useToast();
  const [catalog, setCatalog] = useState<CustomizationItem[]>(initialCatalog);
  const [walletBalance, setWalletBalance] = useState<number>(4200);
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>("#6C4BFF");
  const [selectedItemToPurchase, setSelectedItemToPurchase] = useState<CustomizationItem | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState<boolean>(false);
  const [customFieldName, setCustomFieldName] = useState<string>("");
  const [customFieldType, setCustomFieldType] = useState<string>("Text");
  const [customFields, setCustomFields] = useState<{ name: string; type: string }[]>([
    { name: "PO Reference #", type: "Text" },
    { name: "Cost Center Code", type: "Text" },
  ]);

  const totalSlots = currentTier === "custom" ? 10 : currentTier === "standard" ? 2 : 0;
  const slotsUsed = catalog.filter((c) => c.enabled).length;

  const handleToggleCustomization = (item: CustomizationItem) => {
    if (item.enabled) {
      // Deactivate
      setCatalog((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, enabled: false } : c))
      );
      info("Slot Released", `${item.name} deactivated. Freed 1 customization slot.`);
    } else {
      // Check if slot available
      if (slotsUsed >= totalSlots) {
        error(
          "Slot Limit Reached",
          `You have used all ${totalSlots} included slots. Upgrade to Custom tier or buy slot bundles below.`
        );
        return;
      }

      setSelectedItemToPurchase(item);
      setIsPurchaseModalOpen(true);
    }
  };

  const handleConfirmPurchase = () => {
    if (!selectedItemToPurchase) return;

    if (walletBalance < selectedItemToPurchase.cost) {
      error("Insufficient Wallet Balance", "Please top up your Customization Wallet credits first.");
      return;
    }

    setWalletBalance((prev) => prev - selectedItemToPurchase.cost);
    setCatalog((prev) =>
      prev.map((c) => (c.id === selectedItemToPurchase.id ? { ...c, enabled: true } : c))
    );

    success(
      "Customization Activated!",
      `Activated ${selectedItemToPurchase.name}. Deducted ₹${selectedItemToPurchase.cost} from wallet (1 slot consumed).`
    );
    setIsPurchaseModalOpen(false);
  };

  const handleBuy5Pack = () => {
    if (walletBalance < 1400) {
      error("Insufficient Credits", "Top up wallet with ₹1,400 to purchase the 5-pack bundle.");
      return;
    }
    setWalletBalance((prev) => prev - 1400);
    success(
      "5-Pack Bundle Purchased!",
      "₹1,400 deducted. 5 additional customization slots granted with 20% discount!"
    );
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldName.trim()) return;

    setCustomFields((prev) => [...prev, { name: customFieldName, type: customFieldType }]);
    setCustomFieldName("");
    setIsNewFieldModalOpen(false);
    success("Custom Field Added", `Added field "${customFieldName}" to all subscription contracts.`);
  };

  const themeColors = [
    { name: "LoopDesk Violet", hex: "#6C4BFF" },
    { name: "Teal Momentum", hex: "#00C2A8" },
    { name: "Coral Energy", hex: "#FF7A59" },
    { name: "Sunny Gold", hex: "#FFC93C" },
    { name: "Deep Navy", hex: "#1B1F3B" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EAF2]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#1B1F3B] tracking-tight">
              Customization Studio
            </h1>
            <Badge variant="custom" size="sm" dot>
              REVENUE ENGINE
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tailor themes, fields, templates, and modules with live wallet meter and slot counting.
          </p>
        </div>

        {/* Live Wallet & Slot Meter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#E9EAF2] bg-white shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="h-4 w-4 text-[#00C2A8]" />
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Balance</span>
                <span className="text-sm font-black text-[#1B1F3B]">
                  ₹{walletBalance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <span className="text-gray-200">|</span>

            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-[#FF7A59]" />
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Slot Usage</span>
                <span className="text-sm font-black text-[#6C4BFF]">
                  {slotsUsed} / {totalSlots}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setWalletBalance((prev) => prev + 2500);
                success("Wallet Top-up Successful", "Added ₹2,500 credits to your Customization Wallet.");
              }}
              className="ml-2 px-2.5 py-1 text-xs font-bold text-[#6C4BFF] bg-[#F0EDFF] hover:bg-[#E5E0FF] rounded-lg transition-colors cursor-pointer"
            >
              + Top-up
            </button>
          </div>
        </div>
      </div>

      {/* Special Offer Banner: 5-Pack Customization Bundle */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#6C4BFF] to-[#8C6BFF] p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
            <Zap className="h-5 w-5 text-[#FFC93C]" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Customization 5-Pack Bundle Available</h4>
            <p className="text-xs text-white/80">
              Get 5 customization slots for ₹1,400 (Save ₹350 · 20% discount). Billed from wallet.
            </p>
          </div>
        </div>
        <button
          onClick={handleBuy5Pack}
          className="px-4 py-2 bg-white text-[#6C4BFF] text-xs font-extrabold rounded-xl shadow-xs hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
        >
          Buy 5-Pack Bundle (₹1,400)
        </button>
      </div>

      {/* Studio Workspace Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual Customizers (Theme & Custom Fields) */}
        <div className="space-y-6">
          {/* Theme Color Picker */}
          <div className="p-6 rounded-2xl border border-[#E9EAF2] bg-white shadow-xs">
            <h3 className="text-sm font-bold text-[#1B1F3B] flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#6C4BFF]" />
              Workspace Accent Theme
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select your organization's primary brand highlight color.
            </p>

            <div className="mt-4 flex items-center gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => {
                    setSelectedThemeColor(color.hex);
                    success("Theme Updated", `Switched workspace accent to ${color.name}.`);
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer shadow-xs ${
                    selectedThemeColor === color.hex ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedThemeColor === color.hex && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Live Theme Preview Pill */}
            <div className="mt-5 p-3 rounded-xl bg-[#F7F8FC] border border-[#E9EAF2] flex items-center justify-between">
              <span className="text-xs text-gray-600 font-semibold">Active Palette:</span>
              <span
                className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: selectedThemeColor }}
              >
                {themeColors.find((c) => c.hex === selectedThemeColor)?.name}
              </span>
            </div>
          </div>

          {/* Custom Fields Manager */}
          <div className="p-6 rounded-2xl border border-[#E9EAF2] bg-white shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9EAF2]">
              <div>
                <h3 className="text-sm font-bold text-[#1B1F3B] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#00C2A8]" />
                  Subscription Custom Fields
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Active on contract lines</p>
              </div>
              <button
                onClick={() => setIsNewFieldModalOpen(true)}
                className="p-1.5 rounded-lg bg-[#F0EDFF] text-[#6C4BFF] hover:bg-[#E5E0FF] transition-colors cursor-pointer"
                title="Add Field"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {customFields.map((field) => (
                <div
                  key={field.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E9EAF2] text-xs font-semibold text-[#1B1F3B]"
                >
                  <span>{field.name}</span>
                  <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {field.type}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsNewFieldModalOpen(true)}
              className="mt-4 w-full py-2 border border-dashed border-[#6C4BFF]/40 text-[#6C4BFF] text-xs font-bold rounded-xl hover:bg-[#F0EDFF]/30 transition-colors cursor-pointer"
            >
              + Add Custom Metadata Field
            </button>
          </div>
        </div>

        {/* Right Column: Customization Items Grid (Span 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1B1F3B]">
                Available Customization Slots & Modules
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Each active customization consumes 1 slot and is charged from your wallet.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500">
              {slotsUsed} of {totalSlots} slots active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalog.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  item.enabled
                    ? "border-[#6C4BFF]/40 bg-[#F0EDFF]/20 shadow-xs"
                    : "border-[#E9EAF2] bg-white hover:border-gray-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-[#1B1F3B]">
                      ₹{item.cost}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">/ 1 slot</span>
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-[#1B1F3B]">{item.name}</h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E9EAF2] flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      item.enabled ? "text-emerald-600" : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.enabled ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                    {item.enabled ? "Active" : "Inactive"}
                  </span>

                  <button
                    onClick={() => handleToggleCustomization(item)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                      item.enabled
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-[#6C4BFF] hover:bg-[#5A3BE6] text-white shadow-xs"
                    }`}
                  >
                    {item.enabled ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedItemToPurchase && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title={`Activate ${selectedItemToPurchase.name}`}
          description={`Confirm slot consumption and wallet charge.`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#E9EAF2] space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Customization Item:</span>
                <span className="font-bold text-[#1B1F3B]">{selectedItemToPurchase.name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Wallet Cost:</span>
                <span className="font-bold text-[#6C4BFF]">₹{selectedItemToPurchase.cost}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Slot Consumed:</span>
                <span className="font-bold text-[#FF7A59]">1 Slot</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-200">
                <span>Wallet Balance After:</span>
                <span className="font-bold text-emerald-700">
                  ₹{(walletBalance - selectedItemToPurchase.cost).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-[#00C2A8]" />
              <span>You can deactivate this item anytime to release the slot back to your pool.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPurchaseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmPurchase}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm & Activate
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Field Modal */}
      <Modal
        isOpen={isNewFieldModalOpen}
        onClose={() => setIsNewFieldModalOpen(false)}
        title="Create Custom Subscription Field"
        description="Add a new custom tracking attribute to all subscription lines."
        maxWidth="md"
      >
        <form onSubmit={handleAddCustomField} className="space-y-4">
          <Input
            label="Field Label"
            placeholder="e.g. Purchase Order #"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider">
              Field Type
            </label>
            <select
              value={customFieldType}
              onChange={(e) => setCustomFieldType(e.target.value)}
              className="w-full rounded-xl border border-[#E9EAF2] bg-white px-3.5 py-2.5 text-sm text-[#1B1F3B] outline-none focus:border-[#6C4BFF] focus:ring-2 focus:ring-[#6C4BFF]/10"
            >
              <option value="Text">Text (String)</option>
              <option value="Number">Number (Integer / Decimal)</option>
              <option value="Date">Date Picker</option>
              <option value="Dropdown">Dropdown (Select Option)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsNewFieldModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Custom Field
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
