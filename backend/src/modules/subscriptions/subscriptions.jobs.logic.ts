export function nextSubscriptionAutoCloseAt(now = new Date()): Date {
  if (!Number.isFinite(now.getTime())) throw new RangeError('now must be a valid date');
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
