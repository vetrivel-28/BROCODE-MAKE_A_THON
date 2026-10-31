import React from 'react';

export interface StatusPillProps {
  status: string;
  isOverdue?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, isOverdue }) => {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-gray-100 text-gray-700';

  if (norm === 'PAID') {
    colorClasses = 'bg-accent-light text-accent border border-accent/20';
  } else if (norm === 'CONFIRMED') {
    colorClasses = 'bg-primary-light text-primary border border-primary/20';
  } else if (norm === 'DRAFT') {
    colorClasses = 'bg-gray-100 text-gray-600 border border-gray-200';
  } else if (norm === 'CANCELLED') {
    colorClasses = 'bg-gray-200 text-gray-500 line-through';
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colorClasses}`}>
        {norm}
      </span>
      {isOverdue && (
        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-warm-light text-warm border border-warm/20 rounded-full animate-pulse">
          OVERDUE
        </span>
      )}
    </div>
  );
};
