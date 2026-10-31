import { useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';

interface VariantDraft { attribute: string; value: string; extraPrice: string }

export default function ProductFormPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await catalogApi.createProduct({ name, type, salesPrice, costPrice, notes: notes || null, variants });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save product');
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">New product</h1>
      <form onSubmit={submit} className="max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">Name<input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border p-3" /></label>
          <label className="space-y-1">Type<input required maxLength={80} value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border p-3" /></label>
          <label className="space-y-1">Sales price<input required min="0" step="0.01" type="number" value={salesPrice} onChange={(event) => setSalesPrice(event.target.value)} className="w-full rounded-xl border p-3" /></label>
          <label className="space-y-1">Cost price<input required min="0" step="0.01" type="number" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} className="w-full rounded-xl border p-3" /></label>
        </div>
        <label className="block space-y-1">Notes<textarea maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border p-3" rows={3} /></label>
        <fieldset className="space-y-3"><legend className="font-semibold">Variants</legend>
          {variants.map((variant, index) => <div key={index} className="grid gap-2 sm:grid-cols-3">
            <input aria-label="Variant attribute" placeholder="Attribute" value={variant.attribute} onChange={(event) => setVariants((all) => all.map((item, i) => i === index ? { ...item, attribute: event.target.value } : item))} className="rounded-xl border p-3" />
            <input aria-label="Variant value" placeholder="Value" value={variant.value} onChange={(event) => setVariants((all) => all.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} className="rounded-xl border p-3" />
            <div className="flex flex-col gap-1">
              <input aria-label="Extra price" type="number" min="0" step="0.01" placeholder="Extra price" value={variant.extraPrice} onChange={(event) => setVariants((all) => all.map((item, i) => i === index ? { ...item, extraPrice: event.target.value } : item))} className="rounded-xl border p-3" />
              <span className="text-xs text-slate-500">Result: ₹{((Number(salesPrice) || 0) + (Number(variant.extraPrice) || 0)).toFixed(2)}</span>
            </div>
          </div>)}
          <button type="button" onClick={() => setVariants((all) => [...all, { attribute: '', value: '', extraPrice: '0' }])} className="rounded-xl border px-4 py-2">Add variant</button>
        </fieldset>
        {error && <p role="alert" className="text-rose-700">{error}</p>}
        {saved && <p role="status" className="text-emerald-700">Product saved.</p>}
        <button className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white">Save product</button>
      </form>
    </main>
  );
}
