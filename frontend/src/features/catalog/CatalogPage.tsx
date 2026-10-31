import React, { useEffect, useState } from 'react';

export const CatalogPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [name, setName] = useState('');
  const [priceInr, setPriceInr] = useState(4999);
  const [hasOdooVariant, setHasOdooVariant] = useState(true);

  const token = localStorage.getItem('loopdesk_access_token');

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, planRes, tmplRes] = await Promise.all([
        fetch('/api/catalog/products', { headers }),
        fetch('/api/catalog/plans', { headers }),
        fetch('/api/catalog/templates', { headers })
      ]);

      const [prods, plns, tmpls] = await Promise.all([
        prodRes.json(),
        planRes.json(),
        tmplRes.json()
      ]);

      setProducts(prods.products || []);
      setPlans(plns.plans || []);
      setTemplates(tmpls.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const variants = hasOdooVariant
      ? [
          { name: 'Standard Edition', priceModifierInr: 0 },
          { name: 'Brand Odoo Integration', priceModifierInr: 560 } // Rule: Brand Odoo adds 560
        ]
      : [];

    await fetch('/api/catalog/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        salesPriceInr: priceInr,
        type: 'software',
        variants
      })
    });

    setShowProductModal(false);
    setName('');
    fetchCatalog();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Products, Plans & Quotations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure catalog pricing, product variants, and quotation templates
            </p>
          </div>
          <button
            onClick={() => setShowProductModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-sm transition-all"
          >
            + New Product
          </button>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Products & Variant Pricing</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-400">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((prod) => (
                <div key={prod.id} className="p-4 rounded-xl border border-gray-100 bg-[#F7F8FC]/50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base">{prod.name}</h3>
                    <span className="text-base font-black text-[#6C4BFF]">
                      ₹{(prod.salesPricePaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type: {prod.type}</p>

                  {/* Variants */}
                  {prod.variants && prod.variants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/60 text-xs">
                      <span className="font-bold text-gray-600 block mb-1">Available Variants:</span>
                      <div className="space-y-1">
                        {prod.variants.map((v: any) => (
                          <div key={v.id} className="flex justify-between text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                            <span>{v.name}</span>
                            <span className="font-semibold text-emerald-600">
                              {v.priceModifierPaise > 0 ? `+₹${v.priceModifierPaise / 100}` : 'Base Price'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plans & Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plans */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Recurring Billing Plans</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm">{plan.name}</h4>
                    <span className="text-xs text-gray-400 uppercase tracking-wider capitalize">
                      Cycle: {plan.billingPeriod} • Min Qty: {plan.minQuantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-[#00C2A8]">
                      ₹{(plan.pricePaise / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 block">/{plan.billingPeriod}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quotation Templates */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Quotation Templates</h2>
            <div className="space-y-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{tmpl.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Validity: {tmpl.validityDays} days</p>
                    </div>
                    <span className="text-xs bg-purple-50 text-[#6C4BFF] font-semibold px-2 py-0.5 rounded-full">
                      1-Click Convert
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Create New Product</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="SaaS Analytics Add-on"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Sales Price (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="odooVar"
                    checked={hasOdooVariant}
                    onChange={(e) => setHasOdooVariant(e.target.checked)}
                    className="w-4 h-4 text-[#6C4BFF] rounded"
                  />
                  <label htmlFor="odooVar" className="text-xs text-gray-700">
                    Include "Brand Odoo" variant (+₹560)
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 text-xs text-gray-500 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#6C4BFF] text-white text-xs font-bold shadow"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

