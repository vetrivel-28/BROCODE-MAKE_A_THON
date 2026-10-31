import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  padded = true,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#E9EAF2] bg-white shadow-xs transition-all duration-200 ${
        padded ? "p-6" : ""
      } ${
        interactive
          ? "cursor-pointer hover:border-[#6C4BFF]/40 hover:shadow-md hover:shadow-[#6C4BFF]/5 hover:-translate-y-0.5"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`flex items-center justify-between pb-4 border-b border-[#E9EAF2]/80 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`text-base font-bold text-[#1B1F3B] tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-xs text-gray-500 mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);
