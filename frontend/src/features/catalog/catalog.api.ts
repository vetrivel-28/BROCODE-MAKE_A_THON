import type { CatalogPage, DiscountRule, Plan, Product, QuotationTemplate } from './catalog.types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/catalog${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function query(take: number, cursor?: string) {
  const params = new URLSearchParams({ take: String(take) });
  if (cursor) params.set('cursor', cursor);
  return `?${params}`;
}

export const catalogApi = {
  products: (cursor?: string) => request<CatalogPage<Product>>(`/products${query(25, cursor)}`),
  createProduct: (input: unknown) => request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  plans: (cursor?: string) => request<CatalogPage<Plan>>(`/plans${query(25, cursor)}`),
  createPlan: (input: unknown) => request<Plan>('/plans', { method: 'POST', body: JSON.stringify(input) }),
  templates: (cursor?: string) => request<CatalogPage<QuotationTemplate>>(`/quotation-templates${query(25, cursor)}`),
  createTemplate: (input: unknown) => request<QuotationTemplate>('/quotation-templates', { method: 'POST', body: JSON.stringify(input) }),
  discounts: (cursor?: string) => request<CatalogPage<DiscountRule>>(`/discounts${query(25, cursor)}`),
  createDiscount: (input: unknown) => request<DiscountRule>('/discounts', { method: 'POST', body: JSON.stringify(input) }),
  seatSuggestions: (currentSeats: number, suggestedSeats: number) => request<{
    currentSeats: number;
    suggestedSeats: number;
    incrementalSeats: number;
    eligibleDiscounts: DiscountRule[];
  }>(`/discounts/seat-suggestions?currentSeats=${currentSeats}&suggestedSeats=${suggestedSeats}`),
};
