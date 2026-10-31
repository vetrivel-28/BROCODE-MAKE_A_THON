import type { AuditEventPage, Subscription, SubscriptionAction, SubscriptionPage, SubscriptionStatus } from './subscriptions.types';
import { mockSubscriptionsApi } from './mock.adapter';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/subscriptions${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const subscriptionsApi = {
  list: (options: {
    cursor?: string;
    status?: SubscriptionStatus;
    search?: string;
    fromDate?: string;
    toDate?: string;
  } = {}) => {
    if (useMock) return mockSubscriptionsApi.list(options);
    const params = new URLSearchParams({ take: '20' });
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.status) params.set('status', options.status);
    if (options.search) params.set('search', options.search);
    if (options.fromDate) params.set('fromDate', options.fromDate);
    if (options.toDate) params.set('toDate', options.toDate);
    return request<SubscriptionPage>(`/?${params}`);
  },
  details: (id: string) => useMock ? mockSubscriptionsApi.details(id) : request<Subscription>(`/${encodeURIComponent(id)}`),
  timeline: (id: string, cursor?: string) => {
    if (useMock) return mockSubscriptionsApi.timeline(id, cursor);
    const params = new URLSearchParams({ take: '20' });
    if (cursor) params.set('cursor', cursor);
    return request<AuditEventPage>(`/${encodeURIComponent(id)}/timeline?${params}`);
  },
  createFromTemplate: (input: {
    idempotencyKey: string;
    templateId: string; customerId: string; startDate: string; expiryDate?: string | null; paymentTerms: string; quantity: number;
  }) => useMock
    ? mockSubscriptionsApi.createFromTemplate(input)
    : request<Subscription>('/from-template', { method: 'POST', body: JSON.stringify(input) }),
  transition: (id: string, action: SubscriptionAction, dates?: {
    startDate?: string;
    expiryDate?: string;
    quotationExpiresAt?: string;
    idempotencyKey?: string;
  }) =>
    useMock
      ? mockSubscriptionsApi.transition(id, action, dates)
      : request<Subscription>(`/${encodeURIComponent(id)}/transitions`, { method: 'POST', body: JSON.stringify({ action, ...dates }) }),
  applicableDiscounts: (id: string, periodStart: string) => useMock
    ? mockSubscriptionsApi.applicableDiscounts(id, periodStart)
    : request<NonNullable<Subscription['appliedDiscounts']>>(`/${encodeURIComponent(id)}/applicable-discounts?periodStart=${encodeURIComponent(periodStart)}`),
};
