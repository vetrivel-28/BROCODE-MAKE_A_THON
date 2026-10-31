import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger" | "warm";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 font-medium",
    md: "text-sm px-4 py-2.5 gap-2 font-semibold",
    lg: "text-base px-6 py-3.5 gap-2.5 font-bold",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#6C4BFF] hover:bg-[#5A3BE6] text-white shadow-md shadow-[#6C4BFF]/20 border border-transparent",
    secondary:
      "bg-[#F0EDFF] hover:bg-[#E5E0FF] text-[#6C4BFF] border border-[#6C4BFF]/20",
    accent:
      "bg-[#00C2A8] hover:bg-[#00A892] text-white shadow-md shadow-[#00C2A8]/20 border border-transparent",
    warm:
      "bg-[#FF7A59] hover:bg-[#E66847] text-white shadow-md shadow-[#FF7A59]/20 border border-transparent",
    outline:
      "bg-white hover:bg-gray-50 text-[#1B1F3B] border border-[#E9EAF2] hover:border-[#6C4BFF]/40 shadow-sm",
    ghost:
      "bg-transparent hover:bg-gray-100/80 text-[#1B1F3B] border border-transparent",
    danger:
      "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 border border-transparent",
  }[variant];

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
