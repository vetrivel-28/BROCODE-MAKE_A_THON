import type { SubscriptionStatus } from '../subscriptions.types';

const colors: Record<SubscriptionStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  QUOTATION: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-violet-100 text-violet-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  CLOSED: 'bg-rose-100 text-rose-800',
};

export default function SubscriptionStatusPill({ status }: { status: SubscriptionStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>{status}</span>;
}
