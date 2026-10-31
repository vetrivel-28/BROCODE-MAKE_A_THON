import { useEffect, useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';
import type { CatalogPage, DiscountRule, Product } from './catalog.types';

function startOfTodayInput(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00`;
}

export default function DiscountManagerPage() {
  const [page, setPage] = useState<CatalogPage<DiscountRule> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCursor, setProductCursor] = useState<string | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [seatInput, setSeatInput] = useState({ currentSeats: 1, suggestedSeats: 6 });
  const [seatSuggestions, setSeatSuggestions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', kind: 'PERCENT' as 'PERCENT' | 'FIXED', value: '', minimumPurchase: '', minimumQuantity: '', startsAt: startOfTodayInput(), endsAt: '', usageLimit: '', appliesTo: 'SUBSCRIPTIONS' as 'PRODUCTS' | 'SUBSCRIPTIONS' });
  async function loadDiscounts(cursor?: string) {
    const next = await catalogApi.discounts({ cursor, take: 20 });
    setPage((current) => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
  }
  useEffect(() => {
    Promise.all([catalogApi.discounts(), catalogApi.products()])
      .then(([discounts, catalog]) => { setPage(discounts); setProducts(catalog.items); setProductCursor(catalog.nextCursor); })
      .catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : 'Unable to load discounts'))
      .finally(() => setLoading(false));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    try {
      const input = {
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        minimumPurchase: form.minimumPurchase || null,
        minimumQuantity: form.minimumQuantity ? Number(form.minimumQuantity) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        productIds: form.appliesTo === 'PRODUCTS' ? productIds : [],
      };
      if (editingId) await catalogApi.updateDiscount(editingId, input);
      else await catalogApi.createDiscount(input);
      setMessage(editingId ? 'Discount rule updated.' : 'Discount rule created.');
      setEditingId(null);
      setForm({ name: '', kind: 'PERCENT', value: '', minimumPurchase: '', minimumQuantity: '', startsAt: startOfTodayInput(), endsAt: '', usageLimit: '', appliesTo: 'SUBSCRIPTIONS' });
      setProductIds([]);
      await loadDiscounts();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save discount'); }
  }
  async function loadMoreProducts() {
    if (!productCursor) return;
    try {
      const next = await catalogApi.products({ cursor: productCursor, take: 20 });
      setProducts((current) => [...current, ...next.items]);
      setProductCursor(next.nextCursor);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to load more products');
    }
  }
  async function suggestSeats() {
    setMessage('');
    try {
      const result = await catalogApi.seatSuggestions(seatInput.currentSeats, seatInput.suggestedSeats);
      setSeatSuggestions(result.eligibleDiscounts.map((discount) =>
        `${discount.name} (${discount.kind === 'PERCENT' ? `${Number(discount.value)}%` : `₹${discount.value}`})`));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to get seat suggestions');
    }
  }
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">Smart discount rules</h1>
      <section className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="basis-full"><h2 className="font-semibold">Seat-based suggestion</h2><p className="text-sm text-slate-500">See which subscription rules become available at a target seat count.</p></div>
        <label>Current seats<input min="0" type="number" value={seatInput.currentSeats} onChange={(e) => setSeatInput({ ...seatInput, currentSeats: Number(e.target.value) })} className="mt-1 block w-36 rounded-xl border p-3" /></label>
        <label>Suggested seats<input min="1" type="number" value={seatInput.suggestedSeats} onChange={(e) => setSeatInput({ ...seatInput, suggestedSeats: Number(e.target.value) })} className="mt-1 block w-36 rounded-xl border p-3" /></label>
        <button type="button" onClick={() => void suggestSeats()} className="rounded-2xl bg-[#00C2A8] px-5 py-3 font-semibold text-white">Suggest discounts</button>
        {!!seatSuggestions.length && <p className="basis-full rounded-xl bg-[#E8FBF7] p-3 text-sm text-slate-700">Add {Math.max(0, seatInput.suggestedSeats - seatInput.currentSeats)} seats to unlock {seatSuggestions.join(', ')}.</p>}
        {!seatSuggestions.length && <p className="basis-full text-sm text-slate-500">For example, add 5 seats to unlock the 10% Seat saver rule.</p>}
      </section>
      <form onSubmit={submit} className="mb-8 grid max-w-5xl gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-3">
        <h2 className="text-lg font-bold sm:col-span-3">{editingId ? 'Edit discount rule' : 'Create discount rule'}</h2>
        <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Discount type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as 'FIXED' | 'PERCENT' })} className="mt-1 w-full rounded-xl border p-3"><option value="PERCENT">Percent</option><option value="FIXED">Fixed amount</option></select></label>
        <label>Value<input required min="0" step="0.01" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Applies to<select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as 'PRODUCTS' | 'SUBSCRIPTIONS' })} className="mt-1 w-full rounded-xl border p-3"><option value="SUBSCRIPTIONS">Subscriptions</option><option value="PRODUCTS">Products</option></select></label>
        <label>Minimum purchase<input min="0" step="0.01" type="number" value={form.minimumPurchase} onChange={(e) => setForm({ ...form, minimumPurchase: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Minimum quantity<input min="1" type="number" value={form.minimumQuantity} onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Starts<input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Ends<input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label>Usage limit<input min="1" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        {form.appliesTo === 'PRODUCTS' && <fieldset className="space-y-2 sm:col-span-3"><legend className="font-semibold">Applicable products</legend>{products.map((product) => <label key={product.id} className="mr-4 inline-flex items-center gap-2">
          <input type="checkbox" checked={productIds.includes(product.id)} onChange={(event) => setProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />{product.name}
        </label>)}{productCursor && <button type="button" onClick={() => void loadMoreProducts()} className="ml-2 rounded-xl border px-3 py-1">Load more products</button>}</fieldset>}
        <div className="sm:col-span-3">{message && <p role={message.startsWith('Unable') ? 'alert' : 'status'} className={`mb-3 ${message.startsWith('Unable') ? 'text-rose-700' : 'text-emerald-700'}`}>{message}</p>}<button className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white">{editingId ? 'Save changes' : 'Add discount'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', kind: 'PERCENT', value: '', minimumPurchase: '', minimumQuantity: '', startsAt: startOfTodayInput(), endsAt: '', usageLimit: '', appliesTo: 'SUBSCRIPTIONS' }); setProductIds([]); }} className="ml-3 rounded-2xl border px-5 py-3">Cancel</button>}</div>
      </form>
      {loading && <p className="mb-3 text-center text-slate-500">Loading discount rules…</p>}
      {!loading && !message.startsWith('Unable') && !page?.items.length && <p className="rounded-2xl bg-white p-8 text-center text-slate-500">No discount rules yet. Create one above to get started.</p>}
      <section className="space-y-3">{page?.items.map((discount) => {
        const expired = Boolean(discount.endsAt && new Date(discount.endsAt) < new Date());
        const exhausted = discount.usageLimit !== null && discount.usageCount >= discount.usageLimit;
        const progress = discount.usageLimit ? Math.min(100, discount.usageCount / discount.usageLimit * 100) : 0;
        return <article key={discount.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ${expired || exhausted ? 'opacity-50 grayscale' : ''}`}>
          <div><h2 className="font-semibold">{discount.name} {expired && <span className="ml-2 text-xs font-medium text-slate-500">Expired</span>}{exhausted && <span className="ml-2 text-xs font-medium text-rose-600">Usage limit reached</span>}</h2><p className="text-sm text-slate-500">{discount.appliesTo} · {discount.kind === 'PERCENT' ? `${Number(discount.value)}%` : `₹${discount.value}`}</p></div>
          <div className="min-w-40">
            <div className="flex justify-between text-xs text-slate-500"><span>Used {discount.usageCount}{discount.usageLimit !== null ? ` of ${discount.usageLimit}` : ''}</span>{discount.usageLimit !== null && <span>{Math.round(progress)}%</span>}</div>
            {discount.usageLimit !== null && <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#00C2A8]" style={{ width: `${progress}%` }} /></div>}
          </div>
          <button type="button" disabled={expired || exhausted} onClick={() => {
            setEditingId(discount.id);
            setForm({
              name: discount.name,
              kind: discount.kind,
              value: discount.value,
              minimumPurchase: discount.minimumPurchase ?? '',
              minimumQuantity: discount.minimumQuantity?.toString() ?? '',
              startsAt: new Date(discount.startsAt).toISOString().slice(0, 16),
              endsAt: discount.endsAt ? new Date(discount.endsAt).toISOString().slice(0, 16) : '',
              usageLimit: discount.usageLimit?.toString() ?? '',
              appliesTo: discount.appliesTo,
            });
            setProductIds(discount.productIds);
          }} className="rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed">Edit</button>
        </article>;
      })}</section>
      {page?.nextCursor && <button onClick={() => void loadDiscounts(page.nextCursor ?? undefined)} className="mt-4 rounded-xl border bg-white px-4 py-2">Load more</button>}
    </main>
  );
}
