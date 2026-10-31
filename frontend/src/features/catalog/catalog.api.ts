import type {
  CatalogPage,
  DiscountInput,
  DiscountRule,
  Plan,
  PlanInput,
  Product,
  ProductInput,
  QuotationTemplate,
  QuotationTemplateInput,
} from './catalog.types';
import { mockCatalogApi } from './mock.adapter';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

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
  products: (options: { cursor?: string; take?: number; search?: string; type?: string } = {}) => useMock
    ? mockCatalogApi.products(options)
    : request<CatalogPage<Product>>(`/products${query(options.take ?? 20, options.cursor)}${searchFilter(options)}`),
  createProduct: (input: ProductInput) => useMock
    ? mockCatalogApi.createProduct(input)
    : request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  plans: (options: { cursor?: string; take?: number; search?: string } = {}) => useMock
    ? mockCatalogApi.plans(options)
    : request<CatalogPage<Plan>>(`/plans${query(options.take ?? 20, options.cursor)}${searchFilter(options)}`),
  createPlan: (input: PlanInput) => useMock
    ? mockCatalogApi.createPlan(input)
    : request<Plan>('/plans', { method: 'POST', body: JSON.stringify(input) }),
  templates: (options: { cursor?: string; take?: number; search?: string } = {}) => useMock
    ? mockCatalogApi.templates(options)
    : request<CatalogPage<QuotationTemplate>>(`/quotation-templates${query(options.take ?? 20, options.cursor)}${searchFilter(options)}`),
  createTemplate: (input: QuotationTemplateInput) => useMock
    ? mockCatalogApi.createTemplate(input)
    : request<QuotationTemplate>('/quotation-templates', { method: 'POST', body: JSON.stringify(input) }),
  discounts: (options: { cursor?: string; take?: number; search?: string } = {}) => useMock
    ? mockCatalogApi.discounts(options)
    : request<CatalogPage<DiscountRule>>(`/discounts${query(options.take ?? 20, options.cursor)}${searchFilter(options)}`),
  createDiscount: (input: DiscountInput) => useMock
    ? mockCatalogApi.createDiscount(input)
    : request<DiscountRule>('/discounts', { method: 'POST', body: JSON.stringify(input) }),
  updateDiscount: (id: string, input: DiscountInput) => useMock
    ? mockCatalogApi.updateDiscount(id, input)
    : request<DiscountRule>(`/discounts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  seatSuggestions: (currentSeats: number, suggestedSeats: number) => useMock
    ? mockCatalogApi.seatSuggestions(currentSeats, suggestedSeats)
    : request<{
    currentSeats: number;
    suggestedSeats: number;
    incrementalSeats: number;
    eligibleDiscounts: DiscountRule[];
  }>(`/discounts/seat-suggestions?currentSeats=${currentSeats}&suggestedSeats=${suggestedSeats}`),
};

function searchFilter(options: { search?: string; type?: string }): string {
  const params = new URLSearchParams();
  const search = options.search?.trim();
  if (search) params.set('search', search);
  if (options.type) params.set('type', options.type);
  const suffix = params.toString();
  return suffix ? `&${suffix}` : '';
}
