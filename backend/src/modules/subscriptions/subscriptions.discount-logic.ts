export interface DiscountEligibilityInput {
  startsAt: Date;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  minimumPurchase: string | null;
  minimumQuantity: number | null;
  periodStart: Date;
  purchaseAmount: string;
  quantity: number;
}

function toMinorUnits(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(2, '0'));
  return whole * 100n + fraction;
}

function fromMinorUnits(value: bigint): string {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function sumMoney(values: readonly string[]): string {
  const total = values.reduce((sum, value) => {
    const minorUnits = toMinorUnits(value);
    if (minorUnits === null) throw new RangeError('Money values must have at most two fraction digits');
    return sum + minorUnits;
  }, 0n);
  return fromMinorUnits(total);
}

export function multiplyMoney(value: string, quantity: number): string {
  const minorUnits = toMinorUnits(value);
  if (minorUnits === null || !Number.isSafeInteger(quantity)) throw new RangeError('Money and quantity must be valid');
  return fromMinorUnits(minorUnits * BigInt(quantity));
}

export function getDiscountPurchaseBase(
  appliesTo: 'PRODUCTS' | 'SUBSCRIPTIONS',
  targets: readonly string[],
  lines: readonly { productId: string; quantity: number; amount: string }[],
  planPrice: string,
  subscriptionQuantity: number,
): { purchaseAmount: string; quantity: number } | null {
  const selectedLines = appliesTo === 'PRODUCTS'
    ? lines.filter((line) => targets.includes(line.productId))
    : lines;
  if (appliesTo === 'PRODUCTS' && selectedLines.length === 0) return null;
  const lineAmount = sumMoney(selectedLines.map((line) => line.amount));
  const purchaseAmount = appliesTo === 'SUBSCRIPTIONS'
    ? sumMoney([lineAmount, multiplyMoney(planPrice, subscriptionQuantity)])
    : lineAmount;
  const quantity = appliesTo === 'SUBSCRIPTIONS'
    ? subscriptionQuantity
    : selectedLines.reduce((total, line) => total + line.quantity, 0);
  return { purchaseAmount, quantity };
}

export function isDiscountEligible(input: DiscountEligibilityInput): boolean {
  if (
    !Number.isFinite(input.periodStart.getTime())
    || !Number.isFinite(input.startsAt.getTime())
    || (input.endsAt !== null && !Number.isFinite(input.endsAt.getTime()))
    || input.usageCount < 0
    || input.quantity < 0
  ) return false;
  if (input.periodStart < input.startsAt || (input.endsAt && input.periodStart > input.endsAt)) return false;
  if (input.usageLimit !== null && input.usageCount >= input.usageLimit) return false;
  if (input.minimumQuantity !== null && input.quantity < input.minimumQuantity) return false;
  if (input.minimumPurchase !== null) {
    const minimum = toMinorUnits(input.minimumPurchase);
    const amount = toMinorUnits(input.purchaseAmount);
    if (minimum === null || amount === null || amount < minimum) return false;
  }
  return true;
}

export function calculateDiscountAmount(
  amount: string,
  kind: 'FIXED' | 'PERCENT',
  value: string,
): string {
  const baseMinor = toMinorUnits(amount);
  const valueMinor = toMinorUnits(value);
  if (baseMinor === null || valueMinor === null || baseMinor < 0n || valueMinor < 0n) {
    throw new RangeError('Discount amounts must be non-negative decimal values with at most two fraction digits');
  }
  const discountMinor = kind === 'PERCENT'
    ? (baseMinor * valueMinor + 5000n) / 10000n
    : valueMinor;
  const result = discountMinor > baseMinor ? baseMinor : discountMinor;
  return `${result / 100n}.${String(result % 100n).padStart(2, '0')}`;
}
