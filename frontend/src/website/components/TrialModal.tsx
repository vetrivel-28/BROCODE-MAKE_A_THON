import React, { useState } from "react";
import { Sparkles, Building2, Mail, Phone, Globe2, Users2 } from "lucide-react";
import { Modal } from "../../shared/components/Modal";
import { Input } from "../../shared/components/Input";
import { Button } from "../../shared/components/Button";
import { useToast } from "../../shared/components/Toast";

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: "free" | "standard" | "custom";
  onSuccess: (data: TrialFormData) => void;
}

export interface TrialFormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  companySize: string;
  tier: "free" | "standard" | "custom";
  industry: "saas" | "retail" | "gym" | "coaching";
}

export const TrialModal: React.FC<TrialModalProps> = ({
  isOpen,
  onClose,
  defaultTier = "standard",
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [formData, setFormData] = useState<TrialFormData>({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    country: "India",
    companySize: "1-10",
    tier: defaultTier,
    industry: "saas",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.companyName.trim()) {
      error("Missing fields", "Please fill in your name, company, and email.");
      return;
    }

    if (!formData.email.includes("@")) {
      error("Invalid email", "Please enter a valid business email address.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success("Trial Workspace Ready!", `Welcome ${formData.fullName}! Your ${formData.tier.toUpperCase()} workspace is ready.`);
      onSuccess(formData);
      onClose();
    }, 700);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start your 14-day free trial"
      description="Instant workspace access. No credit card required. Cancel anytime."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tier Selector Chips */}
        <div>
          <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider mb-2">
            Selected Tier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["free", "standard", "custom"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setFormData({ ...formData, tier: t })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  formData.tier === t
                    ? "border-[#6C4BFF] bg-[#F0EDFF] text-[#6C4BFF] shadow-xs ring-1 ring-[#6C4BFF]"
                    : "border-[#E9EAF2] bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="capitalize">{t}</div>
                <div className="text-[10px] text-gray-500 font-normal">
                  {t === "free" ? "₹0" : t === "standard" ? "₹580/mo" : "₹1080/mo"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Industry Starter Pack */}
        <div>
          <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider mb-2">
            Industry Starter Pack (Pre-seeds products & plans)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["saas", "retail", "gym", "coaching"] as const).map((ind) => (
              <button
                type="button"
                key={ind}
                onClick={() => setFormData({ ...formData, industry: ind })}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  formData.industry === ind
                    ? "border-[#00C2A8] bg-[#E6FAF6] text-[#00A892] ring-1 ring-[#00C2A8]"
                    : "border-[#E9EAF2] bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="capitalize">{ind}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Two-column inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Company Name"
            placeholder="Acme Technologies"
            leftIcon={<Building2 className="h-4 w-4" />}
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Work Email"
            type="email"
            placeholder="jane@acme.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="h-4 w-4" />}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider">
              Country
            </label>
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full rounded-xl border border-[#E9EAF2] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1B1F3B] outline-none focus:border-[#6C4BFF] focus:ring-2 focus:ring-[#6C4BFF]/10"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Singapore">Singapore</option>
                <option value="UAE">United Arab Emirates</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#1B1F3B] uppercase tracking-wider">
              Company Size
            </label>
            <div className="relative">
              <Users2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full rounded-xl border border-[#E9EAF2] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1B1F3B] outline-none focus:border-[#6C4BFF] focus:ring-2 focus:ring-[#6C4BFF]/10"
              >
                <option value="1-10">1 - 10 employees</option>
                <option value="11-50">11 - 50 employees</option>
                <option value="51-200">51 - 200 employees</option>
                <option value="201+">201+ employees</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="h-4 w-4 text-[#FFC93C]" />}
          >
            Create My Free Workspace Now
          </Button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            By signing up, you agree to LoopDesk terms. Includes 14-day full feature trial.
          </p>
        </div>
      </form>
    </Modal>
  );
};
