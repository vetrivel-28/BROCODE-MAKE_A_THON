import React from "react";

export type BadgeVariant =
  | "active"
  | "confirmed"
  | "draft"
  | "quotation"
  | "paid"
  | "closed"
  | "overdue"
  | "paused"
  | "healthy"
  | "at-risk"
  | "critical"
  | "free"
  | "standard"
  | "custom"
  | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  size = "md",
  dot = false,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-full gap-1",
    md: "px-2.5 py-1 text-xs font-bold rounded-full gap-1.5",
  }[size];

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string; border: string }> = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dotColor: "bg-emerald-500",
      border: "border-emerald-200",
    },
    confirmed: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dotColor: "bg-blue-500",
      border: "border-blue-200",
    },
    paid: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      dotColor: "bg-[#00C2A8]",
      border: "border-teal-200",
    },
    draft: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dotColor: "bg-gray-400",
      border: "border-gray-200",
    },
    quotation: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      dotColor: "bg-indigo-500",
      border: "border-indigo-200",
    },
    paused: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dotColor: "bg-amber-500",
      border: "border-amber-200",
    },
    closed: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      dotColor: "bg-slate-400",
      border: "border-slate-200",
    },
    overdue: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      dotColor: "bg-rose-500",
      border: "border-rose-200",
    },
    healthy: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dotColor: "bg-emerald-500",
      border: "border-emerald-200",
    },
    "at-risk": {
      bg: "bg-amber-50",
      text: "text-amber-800",
      dotColor: "bg-amber-500",
      border: "border-amber-200",
    },
    critical: {
      bg: "bg-red-50",
      text: "text-red-700",
      dotColor: "bg-red-500",
      border: "border-red-200",
    },
    free: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      dotColor: "bg-slate-500",
      border: "border-slate-200",
    },
    standard: {
      bg: "bg-purple-50",
      text: "text-[#6C4BFF]",
      dotColor: "bg-[#6C4BFF]",
      border: "border-purple-200",
    },
    custom: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      dotColor: "bg-[#FFC93C]",
      border: "border-amber-200",
    },
    neutral: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dotColor: "bg-gray-400",
      border: "border-gray-200",
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center border ${style.bg} ${style.text} ${style.border} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dotColor} shrink-0 animate-pulse`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
