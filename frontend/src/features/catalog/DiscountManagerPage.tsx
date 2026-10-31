import { useEffect, useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';
import type { CatalogPage, DiscountRule, Product } from './catalog.types';

export default function DiscountManagerPage() {
  const [page, setPage] = useState<CatalogPage<DiscountRule> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCursor, setProductCursor] = useState<string | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [seatInput, setSeatInput] = useState({ currentSeats: 1, suggestedSeats: 2 });
  const [seatSuggestions, setSeatSuggestions] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', kind: 'PERCENT' as 'PERCENT' | 'FIXED', value: '', minimumPurchase: '', minimumQuantity: '', startsAt: '', endsAt: '', usageLimit: '', appliesTo: 'SUBSCRIPTIONS' as 'PRODUCTS' | 'SUBSCRIPTIONS' });
  async function loadDiscounts(cursor?: string) {
    const next = await catalogApi.discounts(cursor);
    setPage((current) => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
  }
  useEffect(() => {
    Promise.all([catalogApi.discounts(), catalogApi.products()])
      .then(([discounts, catalog]) => { setPage(discounts); setProducts(catalog.items); setProductCursor(catalog.nextCursor); })
      .catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : 'Unable to load discounts'));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    try {
      await catalogApi.createDiscount({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        minimumPurchase: form.minimumPurchase || null,
        minimumQuantity: form.minimumQuantity ? Number(form.minimumQuantity) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        productIds: form.appliesTo === 'PRODUCTS' ? productIds : [],
      });
      setMessage('Discount rule saved.');
      await loadDiscounts();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save discount'); }
  }
  async function loadMoreProducts() {
    if (!productCursor) return;
    try {
      const next = await catalogApi.products(productCursor);
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
        `${discount.name} (${discount.kind === 'PERCENT' ? `${discount.value}%` : `₹${discount.value}`})`));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to get seat suggestions');
    }
  }
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">Smart discount rules</h1>
      <section className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <label>Current seats<input min="0" type="number" value={seatInput.currentSeats} onChange={(e) => setSeatInput({ ...seatInput, currentSeats: Number(e.target.value) })} className="mt-1 block w-36 rounded-xl border p-3" /></label>
        <label>Suggested seats<input min="1" type="number" value={seatInput.suggestedSeats} onChange={(e) => setSeatInput({ ...seatInput, suggestedSeats: Number(e.target.value) })} className="mt-1 block w-36 rounded-xl border p-3" /></label>
        <button type="button" onClick={() => void suggestSeats()} className="rounded-2xl bg-[#00C2A8] px-5 py-3 font-semibold text-white">Suggest discounts</button>
        {!!seatSuggestions.length && <p className="basis-full text-sm text-slate-600">Eligible: {seatSuggestions.join(', ')}</p>}
      </section>
      <form onSubmit={submit} className="mb-8 grid max-w-5xl gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-3">
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
        <div className="sm:col-span-3">{message && <p role="status" className="mb-3">{message}</p>}<button className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white">Add discount</button></div>
      </form>
      <section className="space-y-3">{page?.items.map((discount) => <article key={discount.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold">{discount.name}</h2><p className="text-sm text-slate-500">{discount.appliesTo} · {discount.kind === 'PERCENT' ? `${discount.value}%` : `₹${discount.value}`}</p></div>
        <span className="rounded-full bg-[#FFF3C4] px-3 py-1 text-sm">{discount.usageCount}{discount.usageLimit ? ` / ${discount.usageLimit}` : ''} uses</span>
      </article>)}</section>
      {page?.nextCursor && <button onClick={() => void loadDiscounts(page.nextCursor ?? undefined)} className="mt-4 rounded-xl border bg-white px-4 py-2">Load more</button>}
    </main>
  );
}
