import { useEffect, useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';
import type { Plan, Product } from './catalog.types';

interface LineDraft { productId: string; quantity: number; unitPrice: string; taxRate: string }

export default function QuotationTemplateBuilderPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [planCursor, setPlanCursor] = useState<string | null>(null);
  const [productCursor, setProductCursor] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [planId, setPlanId] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([catalogApi.plans(), catalogApi.products()]).then(([planPage, productPage]) => {
      setPlans(planPage.items); setPlanCursor(planPage.nextCursor);
      setProducts(productPage.items); setProductCursor(productPage.nextCursor);
    }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : 'Unable to load catalog'));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    try {
      await catalogApi.createTemplate({ name, validityDays, planId, lines });
      setMessage('Quotation template saved.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save template'); }
  }
  async function loadMorePlans() {
    if (!planCursor) return;
    try {
      const next = await catalogApi.plans(planCursor);
      setPlans((current) => [...current, ...next.items]);
      setPlanCursor(next.nextCursor);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to load more plans');
    }
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

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">Quotation template builder</h1>
      <form onSubmit={submit} className="max-w-4xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <label>Template name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Validity (days)<input required type="number" min="1" max="365" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Plan<select required value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-1 w-full rounded-xl border p-3"><option value="">Select plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · ₹{plan.price}</option>)}</select>
            {planCursor && <button type="button" onClick={() => void loadMorePlans()} className="mt-2 rounded-lg border px-3 py-1 text-sm">Load more plans</button>}
          </label>
        </div>
        <section className="space-y-3"><h2 className="font-semibold">Product lines</h2>
          {lines.map((line, index) => <div key={index} className="grid gap-2 sm:grid-cols-4">
            <select required aria-label="Product" value={line.productId} onChange={(e) => setLines((all) => all.map((item, i) => i === index ? { ...item, productId: e.target.value } : item))} className="rounded-xl border p-3"><option value="">Product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
            <input aria-label="Quantity" type="number" min="1" value={line.quantity} onChange={(e) => setLines((all) => all.map((item, i) => i === index ? { ...item, quantity: Number(e.target.value) } : item))} className="rounded-xl border p-3" />
            <input aria-label="Unit price" type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => setLines((all) => all.map((item, i) => i === index ? { ...item, unitPrice: e.target.value } : item))} placeholder="Unit price" className="rounded-xl border p-3" />
            <input aria-label="Tax rate" type="number" min="0" step="0.0001" value={line.taxRate} onChange={(e) => setLines((all) => all.map((item, i) => i === index ? { ...item, taxRate: e.target.value } : item))} placeholder="Tax %" className="rounded-xl border p-3" />
          </div>)}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setLines((all) => [...all, { productId: '', quantity: 1, unitPrice: '0', taxRate: '0' }])} className="rounded-xl border px-4 py-2">Add line</button>
            {productCursor && <button type="button" onClick={() => void loadMoreProducts()} className="rounded-xl border px-4 py-2">Load more products</button>}
          </div>
        </section>
        {message && <p role="status">{message}</p>}
        <button disabled={!lines.length} className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white disabled:opacity-50">Save template</button>
      </form>
    </main>
  );
}
