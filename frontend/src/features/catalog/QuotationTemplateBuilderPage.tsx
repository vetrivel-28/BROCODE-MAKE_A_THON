import { useEffect, useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';
import type { Plan, Product } from './catalog.types';
import { subscriptionsApi } from '../subscriptions/subscriptions.api';

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
  const [loading, setLoading] = useState(true);
  const [savedTemplateId, setSavedTemplateId] = useState('');
  const [subscriptionForm, setSubscriptionForm] = useState({
    customerId: '',
    quantity: '1',
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    paymentTerms: 'Due on receipt',
  });
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  useEffect(() => {
    Promise.all([catalogApi.plans({ take: 20 }), catalogApi.products({ take: 20 })]).then(([planPage, productPage]) => {
      setPlans(planPage.items); setPlanCursor(planPage.nextCursor);
      setProducts(productPage.items); setProductCursor(productPage.nextCursor);
    }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : 'Unable to load catalog'))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    try {
      const saved = await catalogApi.createTemplate({ name, validityDays, planId, lines });
      setSavedTemplateId(saved.id);
      setMessage('Quotation template saved.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save template'); }
  }
  async function createSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!savedTemplateId) return;
    setCreatingSubscription(true);
    setMessage('');
    try {
      const created = await subscriptionsApi.createFromTemplate({
        idempotencyKey: crypto.randomUUID(),
        templateId: savedTemplateId,
        customerId: subscriptionForm.customerId,
        startDate: new Date(`${subscriptionForm.startDate}T00:00:00.000Z`).toISOString(),
        expiryDate: subscriptionForm.expiryDate ? new Date(`${subscriptionForm.expiryDate}T00:00:00.000Z`).toISOString() : null,
        paymentTerms: subscriptionForm.paymentTerms,
        quantity: Number(subscriptionForm.quantity),
      });
      setMessage(`Quotation SUB-${created.number} created for ${created.customerName ?? created.customerId}.`);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to create subscription'); }
    finally { setCreatingSubscription(false); }
  }
  async function loadMorePlans() {
    if (!planCursor) return;
    try {
      const next = await catalogApi.plans({ cursor: planCursor, take: 20 });
      setPlans((current) => [...current, ...next.items]);
      setPlanCursor(next.nextCursor);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to load more plans');
    }
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

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const linesSubtotal = lines.reduce((total, line) => total + Number(line.unitPrice || 0) * line.quantity, 0);
  const taxTotal = lines.reduce((total, line) => total + Number(line.unitPrice || 0) * line.quantity * Number(line.taxRate || 0) / 100, 0);
  const total = linesSubtotal + taxTotal + Number(selectedPlan?.price ?? 0);
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">Quotation template builder</h1>
      {loading && <p className="mb-4 text-slate-500">Loading plans and products…</p>}
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
            <label className="text-xs text-slate-500">Tax rate %
              <input aria-label="Tax rate" type="number" min="0" step="0.01" value={line.taxRate} onChange={(e) => setLines((all) => all.map((item, i) => i === index ? { ...item, taxRate: e.target.value } : item))} placeholder="Tax %" className="mt-1 w-full rounded-xl border p-3 text-sm text-[#1B1F3B]" />
            </label>
          </div>)}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setLines((all) => [...all, { productId: '', quantity: 1, unitPrice: '0', taxRate: '0' }])} className="rounded-xl border px-4 py-2">Add line</button>
            {productCursor && <button type="button" onClick={() => void loadMoreProducts()} className="rounded-xl border px-4 py-2">Load more products</button>}
          </div>
        </section>
        <section className="rounded-xl bg-[#F7F8FC] p-4 text-sm">
          <div className="flex justify-between"><span>Plan ({selectedPlan?.name ?? 'not selected'})</span><span>₹{Number(selectedPlan?.price ?? 0).toFixed(2)}</span></div>
          <div className="mt-2 flex justify-between"><span>Product lines</span><span>₹{linesSubtotal.toFixed(2)}</span></div>
          <div className="mt-1 flex justify-between"><span>Estimated tax</span><span>₹{taxTotal.toFixed(2)}</span></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><span>Estimated total / billing period</span><span>₹{total.toFixed(2)}</span></div>
        </section>
        {message && <p role="status" className={message.startsWith('Unable') || message.includes('must') ? 'text-rose-700' : 'text-emerald-700'}>{message}</p>}
        <button disabled={loading || !lines.length} className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white disabled:opacity-50">Save template</button>
      </form>
      {savedTemplateId && <form onSubmit={createSubscription} className="mt-6 max-w-4xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div><h2 className="text-lg font-bold">Create subscription from this template</h2><p className="text-sm text-slate-500">Start a quotation in one step. The plan minimum quantity is checked before it is created.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>Customer name or ID<input required value={subscriptionForm.customerId} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, customerId: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Quantity / seats<input required min={selectedPlan?.minimumQuantity ?? 1} type="number" value={subscriptionForm.quantity} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, quantity: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Start date<input required type="date" value={subscriptionForm.startDate} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, startDate: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Expiry date<input type="date" value={subscriptionForm.expiryDate} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, expiryDate: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="sm:col-span-2">Payment terms<input required value={subscriptionForm.paymentTerms} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, paymentTerms: event.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        </div>
        <button disabled={creatingSubscription} className="rounded-2xl bg-[#00C2A8] px-5 py-3 font-semibold text-white disabled:opacity-50">{creatingSubscription ? 'Creating…' : 'Create quotation subscription'}</button>
      </form>}
    </main>
  );
}
