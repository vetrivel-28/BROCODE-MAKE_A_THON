import React from "react";
import { Layers } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#E9EAF2] bg-[#F7F8FC]/50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDFF] text-[#6C4BFF] mb-4 shadow-xs">
        {icon || <Layers className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-bold text-[#1B1F3B]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-gray-500 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
