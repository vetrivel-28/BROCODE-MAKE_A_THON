import { useState, type FormEvent } from 'react';
import { catalogApi } from './catalog.api';

const periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
type Period = typeof periods[number];

export default function PlanBuilderPage() {
  const [form, setForm] = useState({
    name: '', price: '', billingPeriod: 'MONTHLY' as Period, minimumQuantity: '1',
    availableFrom: '', availableUntil: '', autoClose: false, closable: true, pausable: false, renewable: false,
  });
  const [message, setMessage] = useState('');
  const availabilityEnd = form.availableUntil
    ? new Date(`${form.availableUntil}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'its availability end date';
  const enabledPlanFlags = [
    form.autoClose ? `Closes automatically on ${availabilityEnd}` : '',
    form.closable ? 'the customer can close it' : '',
    form.pausable ? 'the customer can pause it' : '',
    form.renewable ? 'it can be renewed' : '',
  ].filter(Boolean);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      await catalogApi.createPlan({
        ...form, minimumQuantity: Number(form.minimumQuantity),
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : null,
        availableUntil: form.availableUntil ? new Date(form.availableUntil).toISOString() : null,
      });
      setMessage('Plan saved.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save plan'); }
  }
  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <h1 className="mb-6 text-2xl font-bold">Plan builder</h1>
      <form onSubmit={submit} className="max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Price<input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Billing period<select value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value as Period })} className="mt-1 w-full rounded-xl border p-3">{periods.map((period) => <option key={period}>{period}</option>)}</select></label>
          <label>Minimum quantity<input required min="1" type="number" value={form.minimumQuantity} onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Available from<input type="date" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>Available until<input type="date" value={form.availableUntil} onChange={(e) => setForm({ ...form, availableUntil: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          {(['autoClose', 'closable', 'pausable', 'renewable'] as const).map((flag) => <label key={flag} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
            <input type="checkbox" checked={form[flag]} onChange={(e) => setForm({ ...form, [flag]: e.target.checked })} />{flag.replace(/([A-Z])/g, ' $1')}
          </label>)}
        </fieldset>
        <div className="rounded-xl bg-[#F3F0FF] p-4 text-sm">
          <p className="font-semibold">Plan behavior preview</p>
          <p className="mt-1 text-slate-600">{enabledPlanFlags.length ? `${enabledPlanFlags.join('; ')}.` : 'No lifecycle actions are enabled.'} Minimum {form.minimumQuantity || 1} {Number(form.minimumQuantity) === 1 ? 'seat' : 'seats'} · ₹{form.price || '0'} / {form.billingPeriod.toLocaleLowerCase()}.</p>
        </div>
        {message && <p role="status" className={message.includes('Unable') || message.includes('must') ? 'text-rose-700' : 'text-emerald-700'}>{message}</p>}
        <button className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white">Save plan</button>
      </form>
    </main>
  );
}
