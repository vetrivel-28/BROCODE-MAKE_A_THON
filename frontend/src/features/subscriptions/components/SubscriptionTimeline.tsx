import type { AuditEvent } from '../subscriptions.types';

export default function SubscriptionTimeline({ events }: { events: AuditEvent[] }) {
  if (!events.length) return <p className="text-sm text-slate-500">No activity recorded.</p>;
  return (
    <ol className="space-y-4">
      {events.map((event) => <li key={event.id} className="relative border-l-2 border-[#6C4BFF]/20 pl-5">
        <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#6C4BFF]" />
        <p className="font-semibold">{event.eventType.replace(/_/g, ' ').toLowerCase()}</p>
        <p className="text-sm text-slate-500">{event.fromStatus ?? '—'} → {event.toStatus ?? '—'} · {new Date(event.createdAt).toLocaleString()}</p>
        {event.details && <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{JSON.stringify(event.details, null, 2)}</pre>}
      </li>)}
    </ol>
  );
}
