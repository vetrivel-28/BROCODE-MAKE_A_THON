import type { AuditEventPage, Subscription, SubscriptionAction, SubscriptionPage, SubscriptionStatus } from './subscriptions.types';

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
  list: (options: { cursor?: string; status?: SubscriptionStatus } = {}) => {
    const params = new URLSearchParams({ take: '25' });
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.status) params.set('status', options.status);
    return request<SubscriptionPage>(`/?${params}`);
  },
  details: (id: string) => request<Subscription>(`/${encodeURIComponent(id)}`),
  timeline: (id: string, cursor?: string) => {
    const params = new URLSearchParams({ take: '25' });
    if (cursor) params.set('cursor', cursor);
    return request<AuditEventPage>(`/${encodeURIComponent(id)}/timeline?${params}`);
  },
  createFromTemplate: (input: {
    idempotencyKey: string;
    templateId: string; customerId: string; startDate: string; expiryDate?: string | null; paymentTerms: string; quantity: number;
  }) => request<Subscription>('/from-template', { method: 'POST', body: JSON.stringify(input) }),
  transition: (id: string, action: SubscriptionAction, dates?: {
    startDate?: string;
    expiryDate?: string;
    quotationExpiresAt?: string;
    idempotencyKey?: string;
  }) =>
    request<Subscription>(`/${encodeURIComponent(id)}/transitions`, { method: 'POST', body: JSON.stringify({ action, ...dates }) }),
};
