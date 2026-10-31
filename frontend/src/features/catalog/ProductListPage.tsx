import { useEffect, useState } from 'react';
import { catalogApi } from './catalog.api';
import type { CatalogPage, Product } from './catalog.types';

export default function ProductListPage() {
  const [page, setPage] = useState<CatalogPage<Product> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  async function load(cursor?: string) {
    setError('');
    setLoading(true);
    try {
      const next = await catalogApi.products({ cursor, take: 20, search, type: type || undefined });
      setPage((current) => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [search, type]);

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-6 text-[#1B1F3B]">
      <header className="mb-6 flex items-center justify-between">
        <div><p className="text-sm text-slate-500">Catalog</p><h1 className="text-2xl font-bold">Products</h1></div>
        <a className="rounded-2xl bg-[#6C4BFF] px-5 py-3 font-semibold text-white" href="/catalog/products/new">Add product</a>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <input aria-label="Search products" placeholder="Search products…" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-60 rounded-xl border border-slate-200 px-4 py-2" />
          <select aria-label="Filter by product type" value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-2">
            <option value="">All types</option>
            {['SERVICE', 'ADD_ON', 'PRODUCT'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Sales price</th><th className="p-4">Cost price</th><th className="p-4">Variants</th></tr></thead>
          <tbody>{page?.items.map((product) => (
            <tr key={product.id} className="border-t border-slate-100">
              <td className="p-4 font-medium">{product.name}</td><td className="p-4">{product.type}</td>
              <td className="p-4">₹{product.salesPrice}</td><td className="p-4">₹{product.costPrice}</td>
              <td className="p-4">{product.variants.map((variant) => `${variant.attribute}: ${variant.value} (+₹${variant.extraPrice})`).join(', ') || '—'}</td>
            </tr>
          ))}</tbody>
        </table>
        {loading && <p className="p-8 text-center text-slate-500">Loading products…</p>}
        {!loading && !error && !page?.items.length && <p className="p-8 text-center text-slate-500">No products match your search.</p>}
        {page?.nextCursor && <button disabled={loading} className="m-4 rounded-xl border px-4 py-2 disabled:opacity-50" onClick={() => void load(page.nextCursor ?? undefined)}>Load next 20</button>}
      </section>
    </main>
  );
}
