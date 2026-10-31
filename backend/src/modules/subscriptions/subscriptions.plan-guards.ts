export interface PlanAvailabilityPolicy {
  minimumQuantity: number;
  availableFrom: Date | null;
  availableUntil: Date | null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function assertPlanSelectionAllowed(
  plan: PlanAvailabilityPolicy,
  startDate: Date,
  quantity: number,
  now = new Date(),
): void {
  if (!Number.isFinite(startDate.getTime())) throw new RangeError('Subscription start date must be valid');
  if (startDate < startOfUtcDay(now)) throw new Error('Subscription start date cannot be in the past');
  if (!Number.isInteger(quantity) || quantity < plan.minimumQuantity) {
    throw new Error('Minimum plan quantity is not met');
  }
  if ((plan.availableFrom && startDate < plan.availableFrom) || (plan.availableUntil && startDate > plan.availableUntil)) {
    throw new Error('Plan is unavailable on the requested start date');
  }
}
