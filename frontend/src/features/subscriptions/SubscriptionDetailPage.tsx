import { useEffect, useState } from 'react';
import { subscriptionsApi } from './subscriptions.api';
import type { AuditEvent, Subscription, SubscriptionAction } from './subscriptions.types';
import SubscriptionStatusPill from './components/SubscriptionStatusPill';
import SubscriptionTimeline from './components/SubscriptionTimeline';

export default function SubscriptionDetailPage({ subscriptionId }: { subscriptionId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [timelineCursor, setTimelineCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setError('');
    try {
      const [details, timeline] = await Promise.all([
        subscriptionsApi.details(subscriptionId),
        subscriptionsApi.timeline(subscriptionId),
      ]);
      setSubscription(details); setEvents(timeline.items); setTimelineCursor(timeline.nextCursor);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load subscription'); }
  }
  useEffect(() => { void load(); }, [subscriptionId]);

  const actions: Partial<Record<Subscription['status'], SubscriptionAction[]>> = {
    DRAFT: ['submitQuotation'],
    QUOTATION: ['confirm'],
    CONFIRMED: ['activate'],
    ACTIVE: ['pause', 'renew', 'close'],
    PAUSED: ['resume', 'close'],
  };
  async function run(action: SubscriptionAction) {
    setBusy(true); setError('');
    try {
      const quotationExpiresAt = action === 'submitQuotation'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      const storageKey = `loopdesk.subscription-transition:${subscriptionId}:${action}`;
      const idempotencyKey = window.sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
      window.sessionStorage.setItem(storageKey, idempotencyKey);
      await subscriptionsApi.transition(subscriptionId, action, { quotationExpiresAt, idempotencyKey });
      window.sessionStorage.removeItem(storageKey);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Unable to ${action}`); }
    finally { setBusy(false); }
  }

  if (!subscription) return <main className="min-h-screen bg-[#F7F8FC] p-6">{error || 'Loading subscription…'}</main>;
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-slate-500">Subscription SUB-{subscription.number}</p><h1 className="text-2xl font-bold">{subscription.plan.name}</h1></div>
        <SubscriptionStatusPill status={subscription.status} />
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-5">
          <article className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2">
            <div><p className="text-sm text-slate-500">Customer</p><p className="font-semibold">{subscription.customerId}</p></div>
            <div><p className="text-sm text-slate-500">Plan</p><p className="font-semibold">{subscription.plan.name}</p></div>
            <div><p className="text-sm text-slate-500">Seats / quantity</p><p>{subscription.quantity}</p></div>
            <div><p className="text-sm text-slate-500">Start date</p><p>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '—'}</p></div>
            <div><p className="text-sm text-slate-500">Expiry date</p><p>{subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : '—'}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-slate-500">Payment terms</p><p>{subscription.paymentTerms}</p></div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Product lines</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="p-2">Product</th><th className="p-2">Qty</th><th className="p-2">Unit price</th><th className="p-2">Tax</th><th className="p-2">Amount</th></tr></thead>
              <tbody>{subscription.lines.map((line) => <tr key={line.id} className="border-t"><td className="p-2">{line.product?.name ?? line.productId}</td><td className="p-2">{line.quantity}</td><td className="p-2">₹{line.unitPrice}</td><td className="p-2">₹{line.taxAmount}</td><td className="p-2">₹{line.amount}</td></tr>)}</tbody>
            </table></div>
          </article>
          {!!actions[subscription.status]?.length && <section className="flex flex-wrap gap-3">
            {actions[subscription.status]?.map((action) => <button key={action} disabled={busy} onClick={() => void run(action)} className={`rounded-2xl px-4 py-3 font-semibold text-white ${action === 'close' ? 'bg-[#FF7A59]' : 'bg-[#6C4BFF]'}`}>
              {action === 'submitQuotation' ? 'Send quotation' : action[0].toUpperCase() + action.slice(1)}
            </button>)}
          </section>}
        </section>
        <aside className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-5 text-lg font-semibold">Activity timeline</h2><SubscriptionTimeline events={events} />
          {timelineCursor && <button className="mt-4 rounded-xl border px-4 py-2" onClick={async () => {
            try {
              const next = await subscriptionsApi.timeline(subscriptionId, timelineCursor);
              setEvents((current) => [...next.items, ...current]);
              setTimelineCursor(next.nextCursor);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Unable to load timeline');
            }
          }}>Load older activity</button>}
        </aside>
      </div>
    </main>
  );
}
