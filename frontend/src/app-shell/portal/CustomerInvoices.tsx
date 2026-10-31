import React, { useState } from "react";
import {
  Download,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Modal } from "../../shared/components/Modal";
import { useToast } from "../../shared/components/Toast";
import { DataTable } from "../../shared/components/DataTable";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  subNumber: string;
  period: string;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: string;
  status: "Draft" | "Confirmed" | "Paid" | "Overdue";
}

const mockInvoices: InvoiceRecord[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0041",
    subNumber: "SUB-2026-001",
    period: "Oct 01 - Oct 31, 2026",
    amount: 6960,
    tax: 1252,
    totalAmount: 8212,
    dueDate: "2026-11-05",
    status: "Confirmed",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0040",
    subNumber: "SUB-2026-002",
    period: "Sep 01 - Sep 30, 2026",
    amount: 5400,
    tax: 972,
    totalAmount: 6372,
    dueDate: "2026-10-05",
    status: "Paid",
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-0039",
    subNumber: "SUB-2026-001",
    period: "Sep 01 - Sep 30, 2026",
    amount: 6960,
    tax: 1252,
    totalAmount: 8212,
    dueDate: "2026-10-05",
    status: "Paid",
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-0035",
    subNumber: "SUB-2026-003",
    period: "Aug 01 - Aug 31, 2026",
    amount: 350,
    tax: 63,
    totalAmount: 413,
    dueDate: "2026-09-05",
    status: "Overdue",
  },
];

export const CustomerInvoices: React.FC = () => {
  const { success } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenPay = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessing(true);
    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id ? { ...inv, status: "Paid" } : inv
        )
      );
      setIsProcessing(false);
      setIsPayModalOpen(false);
      success(
        "Payment Processed Successfully!",
        `Receipt #REC-${Math.floor(100000 + Math.random() * 900000)} generated for ₹${selectedInvoice.totalAmount.toLocaleString(
          "en-IN"
        )} via ${paymentMethod.toUpperCase()}.`
      );
    }, 900);
  };

  const handleDownloadPdf = (inv: InvoiceRecord) => {
    success(
      "Generating PDF Invoice",
      `Downloading official tax invoice ${inv.invoiceNumber}.pdf...`
    );
  };

  // KPI Calculations
  const totalPaid = invoices
    .filter((i) => i.status === "Paid")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "Confirmed")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalOverdue = invoices
    .filter((i) => i.status === "Overdue")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      render: (item: InvoiceRecord) => (
        <div>
          <span className="font-bold text-[#1B1F3B]">{item.invoiceNumber}</span>
          <div className="text-[11px] text-gray-400">{item.subNumber}</div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Billing Period",
      render: (item: InvoiceRecord) => (
        <span className="text-gray-600 font-medium">{item.period}</span>
      ),
    },
    {
      key: "amount",
      header: "Subtotal / Tax",
      render: (item: InvoiceRecord) => (
        <div className="text-xs">
          <span>₹{item.amount.toLocaleString("en-IN")}</span>
          <span className="text-gray-400 text-[10px]"> (+ ₹{item.tax} GST)</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Due",
      render: (item: InvoiceRecord) => (
        <span className="font-bold text-[#1B1F3B]">
          ₹{item.totalAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (item: InvoiceRecord) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>{item.dueDate}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: InvoiceRecord) => (
        <Badge
          variant={
            item.status === "Paid"
              ? "paid"
              : item.status === "Confirmed"
              ? "confirmed"
              : item.status === "Overdue"
              ? "overdue"
              : "draft"
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
      render: (item: InvoiceRecord) => (
        <div className="flex items-center gap-2">
          {item.status !== "Paid" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenPay(item)}
              leftIcon={<CreditCard className="h-3 w-3" />}
            >
              Pay Now
            </Button>
          )}
          <button
            onClick={() => handleDownloadPdf(item)}
            className="p-1.5 rounded-lg border border-[#E9EAF2] bg-white text-gray-600 hover:text-[#6C4BFF] hover:border-[#6C4BFF] transition-colors cursor-pointer"
            title="Download PDF Invoice"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EAF2]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B1F3B] tracking-tight">
            My Invoices & Receipts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review billing records, download GST-compliant tax invoices, or settle balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="paid" size="md">
            Customer Self-Service Portal
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>PAID TO DATE</span>
            <CheckCircle2 className="h-4 w-4 text-[#00C2A8]" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">All settled invoices</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>OUTSTANDING DUE</span>
            <Clock className="h-4 w-4 text-[#6C4BFF]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#1B1F3B]">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Due in current cycle</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EAF2] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>REVENUE AT RISK (OVERDUE)</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
            {totalOverdue > 0 ? "Autopilot dunning active" : "Zero overdue"}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="mt-8">
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search invoice number or subscription..."
          searchKey={(item) => `${item.invoiceNumber} ${item.subNumber}`}
          filterOptions={[
            { label: "Paid", value: "paid", filterFn: (i) => i.status === "Paid" },
            { label: "Confirmed", value: "confirmed", filterFn: (i) => i.status === "Confirmed" },
            { label: "Overdue", value: "overdue", filterFn: (i) => i.status === "Overdue" },
          ]}
        />
      </div>

      {/* Simulated Razorpay Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pay Invoice ${selectedInvoice.invoiceNumber}`}
          description={`Secure settlement via Razorpay Test Gateway.`}
          maxWidth="md"
        >
          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div className="rounded-2xl bg-[#F0EDFF]/50 p-4 border border-[#6C4BFF]/20 text-center">
              <span className="text-xs font-semibold text-gray-500">Total Settlement Amount</span>
              <p className="text-3xl font-black text-[#6C4BFF] mt-1">
                ₹{selectedInvoice.totalAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Includes ₹{selectedInvoice.tax} GST (18%)
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["card", "upi", "netbanking"] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === method
                        ? "border-[#6C4BFF] bg-[#F0EDFF] text-[#6C4BFF] ring-1 ring-[#6C4BFF]"
                        : "border-[#E9EAF2] bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="uppercase">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00C2A8] shrink-0" />
              <span>Razorpay Test Gateway: Instant confirmation with automated reconciliation.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsPayModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isProcessing}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm & Pay ₹{selectedInvoice.totalAmount.toLocaleString("en-IN")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
