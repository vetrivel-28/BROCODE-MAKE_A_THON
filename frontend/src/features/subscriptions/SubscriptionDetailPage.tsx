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
  const [loading, setLoading] = useState(true);

  async function load() {
    setError('');
    try {
      const [details, timeline] = await Promise.all([
        subscriptionsApi.details(subscriptionId),
        subscriptionsApi.timeline(subscriptionId),
      ]);
      let appliedDiscounts = details.appliedDiscounts ?? [];
      if (details.status === 'ACTIVE') {
        const periodStart = details.nextInvoiceDate ?? details.startDate;
        if (periodStart) appliedDiscounts = await subscriptionsApi.applicableDiscounts(subscriptionId, periodStart);
      }
      setSubscription({ ...details, appliedDiscounts }); setEvents(timeline.items); setTimelineCursor(timeline.nextCursor);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load subscription'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [subscriptionId]);

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

  if (!subscription) return <main className="min-h-screen bg-[#F7F8FC] p-6">{error ? <p role="alert" className="text-rose-700">{error}</p> : loading ? 'Loading subscription…' : 'Subscription not found.'}</main>;
  const lifecycleSteps = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'] as const;
  const currentStep = lifecycleSteps.indexOf(subscription.status as typeof lifecycleSteps[number]);
  const availableActions: Array<{ action: SubscriptionAction; label: string; allowed: boolean; blockedReason?: string }> = [
    ...(subscription.status === 'DRAFT' ? [{ action: 'submitQuotation' as const, label: 'Send quotation', allowed: true }] : []),
    ...(subscription.status === 'QUOTATION' ? [{ action: 'confirm' as const, label: 'Confirm', allowed: true }] : []),
    ...(subscription.status === 'CONFIRMED' ? [{ action: 'activate' as const, label: 'Activate', allowed: true }] : []),
    ...(subscription.status === 'ACTIVE' ? [
      { action: 'pause' as const, label: 'Pause', allowed: subscription.plan.pausable, blockedReason: 'This plan does not allow pausing.' },
      { action: 'renew' as const, label: 'Renew', allowed: subscription.plan.renewable, blockedReason: 'This plan is not renewable.' },
      { action: 'close' as const, label: 'Close', allowed: subscription.plan.closable, blockedReason: 'This plan does not allow manual closing.' },
    ] : []),
    ...(subscription.status === 'PAUSED' ? [
      { action: 'resume' as const, label: 'Resume', allowed: true },
      { action: 'close' as const, label: 'Close', allowed: subscription.plan.closable, blockedReason: 'This plan does not allow manual closing.' },
    ] : []),
  ];
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm text-slate-500">Subscription SUB-{subscription.number}</p><h1 className="text-2xl font-bold">{subscription.plan.name}</h1></div>
        <SubscriptionStatusPill status={subscription.status} />
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {lifecycleSteps.map((step, index) => {
            const completed = subscription.status === 'PAUSED' ? index <= 3 : index <= currentStep;
            return <div key={step} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${completed ? 'bg-[#6C4BFF] text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
              <span className={`text-xs font-medium sm:text-sm ${completed ? 'text-[#1B1F3B]' : 'text-slate-400'}`}>{step[0] + step.slice(1).toLocaleLowerCase()}</span>
              {index < lifecycleSteps.length - 1 && <span className={`h-px flex-1 ${completed && currentStep > index ? 'bg-[#6C4BFF]' : 'bg-slate-200'}`} />}
            </div>;
          })}
        </div>
        {subscription.status === 'PAUSED' && <p className="mt-3 text-sm text-amber-700">Paused is a branch from Active; resume returns this subscription to Active.</p>}
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-5">
          <article className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2">
            <div><p className="text-sm text-slate-500">Customer</p><p className="font-semibold">{subscription.customerName ?? subscription.customerId}</p></div>
            <div><p className="text-sm text-slate-500">Plan</p><p className="font-semibold">{subscription.plan.name}</p></div>
            <div><p className="text-sm text-slate-500">Seats / quantity</p><p>{subscription.quantity}</p></div>
            <div><p className="text-sm text-slate-500">Start date</p><p>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '—'}</p></div>
            <div><p className="text-sm text-slate-500">Expiry date</p><p>{subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : '—'}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-slate-500">Payment terms</p><p>{subscription.paymentTerms}</p></div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Product lines</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="p-2">Product</th><th className="p-2">Qty</th><th className="p-2">Unit price</th><th className="p-2">Tax</th><th className="p-2">Amount</th></tr></thead>
              <tbody>{subscription.lines.map((line) => <tr key={line.id} className="border-t"><td className="p-2">{line.product?.name ?? line.productId}</td><td className="p-2">{line.quantity}</td><td className="p-2">₹{line.unitPrice}</td><td className="p-2">{line.taxRate}% · ₹{line.taxAmount}</td><td className="p-2">₹{line.amount}</td></tr>)}</tbody>
            </table></div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">Discounts on next invoice</h2>
            {subscription.appliedDiscounts?.length
              ? <ul className="space-y-2">{subscription.appliedDiscounts.map((discount) => <li key={discount.discountId} className="flex justify-between rounded-xl bg-[#E8FBF7] p-3 text-sm"><span>{discount.name} · {discount.kind === 'PERCENT' ? `${Number(discount.value)}%` : `₹${discount.value}`}</span><strong>−₹{discount.amount}</strong></li>)}</ul>
              : <p className="text-sm text-slate-500">No eligible discounts are currently applied.</p>}
          </article>
          {!!availableActions.length && <section className="flex flex-wrap gap-3">
            {availableActions.map(({ action, label, allowed, blockedReason }) => <button key={action} disabled={busy || !allowed} title={!allowed ? blockedReason : undefined} onClick={() => void run(action)} className={`rounded-2xl px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${action === 'close' ? 'bg-[#FF7A59]' : 'bg-[#6C4BFF]'}`}>
              {label}{!allowed && <span className="ml-1" aria-hidden="true">ⓘ</span>}
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
