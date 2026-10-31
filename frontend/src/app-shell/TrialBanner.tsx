import React, { useState } from "react";
import { Clock, ArrowRight, X, Sparkles } from "lucide-react";

interface TrialBannerProps {
  daysLeft?: number;
  tier?: string;
  onUpgrade: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  daysLeft = 12,
  tier = "Standard",
  onUpgrade,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#6C4BFF] via-[#7B5CFF] to-[#00C2A8] text-white px-4 py-2.5 text-xs font-semibold shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 shrink-0">
            <Clock className="h-3 w-3 text-white" />
          </div>
          <span className="truncate">
            You are on a <strong>14-day {tier} Trial</strong> ({daysLeft} days remaining). 
            Enjoy automated billing & 2 customization slots!
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#6C4BFF] rounded-lg text-xs font-bold hover:bg-white/90 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-[#FF7A59]" />
            <span>Upgrade Workspace</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
