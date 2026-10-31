import { useEffect, useState, type FormEvent } from 'react';
import { catalogApi } from '../catalog/catalog.api';
import type { QuotationTemplate } from '../catalog/catalog.types';
import { subscriptionsApi } from './subscriptions.api';
import type { Subscription, SubscriptionPage, SubscriptionStatus } from './subscriptions.types';
import SubscriptionStatusPill from './components/SubscriptionStatusPill';

const statuses: SubscriptionStatus[] = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'];

export default function SubscriptionListPage() {
  const [page, setPage] = useState<SubscriptionPage | null>(null);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [templateCursor, setTemplateCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ templateId: '', customerId: '', startDate: '', expiryDate: '', paymentTerms: 'Due on receipt', quantity: '1' });
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  async function load(cursor?: string) {
    setError('');
    setLoading(true);
    try {
      const next = await subscriptionsApi.list({
        cursor,
        status: status || undefined,
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPage((current) => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load subscriptions'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void load();
  }, [status, search, fromDate, toDate]);

  useEffect(() => {
    catalogApi.templates().then((result) => {
      setTemplates(result.items);
      setTemplateCursor(result.nextCursor);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load templates'));
  }, []);

  async function loadMoreTemplates() {
    if (!templateCursor) return;
    try {
      const next = await catalogApi.templates({ cursor: templateCursor, take: 20 });
      setTemplates((current) => [...current, ...next.items]);
      setTemplateCursor(next.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load more templates');
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await subscriptionsApi.createFromTemplate({
        idempotencyKey,
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        quantity: Number(form.quantity),
      });
      setFormOpen(false);
      setIdempotencyKey(crypto.randomUUID());
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create subscription'); }
    finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm text-slate-500">Billing</p><h1 className="text-2xl font-bold">Subscriptions</h1></div>
        <button onClick={() => setFormOpen((open) => !open)} className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white">Create from template</button>
      </header>
      {formOpen && <form onSubmit={create} className="mb-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-3">
        <label>Quotation template<select required value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} className="mt-1 w-full rounded-xl border p-3"><option value="">Select template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
          {templateCursor && <button type="button" onClick={() => void loadMoreTemplates()} className="mt-2 rounded-lg border px-3 py-1 text-sm">Load more templates</button>}
        </label>
        <label>Customer ID<input required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Quantity<input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Start date<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Expiry date<input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Payment terms<input required value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <button disabled={saving} className="rounded-2xl bg-[#00C2A8] px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-3">{saving ? 'Creating…' : 'Create quotation'}</button>
      </form>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">All subscriptions</h2>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setStatus('')} className={`rounded-full px-3 py-1.5 text-sm ${status === '' ? 'bg-[#6C4BFF] text-white' : 'bg-slate-100'}`}>All {page?.statusCounts ? `(${Object.values(page.statusCounts).reduce((sum, count) => sum + count, 0)})` : ''}</button>
          {statuses.map((item) => <button type="button" key={item} onClick={() => setStatus(item)} className={`rounded-full px-3 py-1.5 text-sm ${status === item ? 'bg-[#6C4BFF] text-white' : 'bg-slate-100'}`}>
            {item[0] + item.slice(1).toLocaleLowerCase()} {page?.statusCounts ? `(${page.statusCounts[item]})` : ''}
          </button>)}
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input aria-label="Search subscriptions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number, customer ID or plan…" className="rounded-xl border p-3" />
          <label className="text-xs text-slate-500">Start date from<input aria-label="Start date from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block rounded-xl border p-2 text-sm text-[#1B1F3B]" /></label>
          <label className="text-xs text-slate-500">Start date to<input aria-label="Start date to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 block rounded-xl border p-2 text-sm text-[#1B1F3B]" /></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="p-3">Number</th><th className="p-3">Customer</th><th className="p-3">Plan</th><th className="p-3">Start</th><th className="p-3">Next invoice</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
          <tbody>{page?.items.map((subscription: Subscription) => <tr key={subscription.id} className="border-t border-slate-100">
            <td className="p-3"><a className="font-semibold text-[#6C4BFF]" href={`/subscriptions/${subscription.id}`}>SUB-{subscription.number}</a></td>
            <td className="p-3">{subscription.customerName ?? subscription.customerId}</td><td className="p-3">{subscription.plan.name}</td>
            <td className="p-3">{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-IN') : '—'}</td>
            <td className="p-3">{subscription.nextInvoiceDate ? new Date(subscription.nextInvoiceDate).toLocaleDateString('en-IN') : '—'}</td>
            <td className="p-3 font-medium">₹{subscription.amount ?? (
              Number(subscription.plan.price) * subscription.quantity
              + subscription.lines.reduce((sum, line) => sum + Number(line.amount) + Number(line.taxAmount), 0)
            ).toFixed(2)}</td>
            <td className="p-3"><SubscriptionStatusPill status={subscription.status} /></td>
          </tr>)}</tbody>
        </table></div>
        {loading && <p className="p-6 text-center text-slate-500">Loading subscriptions…</p>}
        {!loading && !error && !page?.items.length && <p className="p-6 text-center text-slate-500">No subscriptions match these filters.</p>}
        {page?.nextCursor && <button disabled={loading} onClick={() => void load(page.nextCursor ?? undefined)} className="mt-4 rounded-xl border px-4 py-2 disabled:opacity-50">Load next 20</button>}
      </section>
    </main>
  );
}
