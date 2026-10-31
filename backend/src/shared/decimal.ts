import { Prisma } from "../generated/prisma/client.js";

export type DecimalValue = Prisma.Decimal;
export const Decimal = Prisma.Decimal;

export function toDecimal(value: number | string): DecimalValue {
  return new Decimal(value);
}

export function add(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.add(b);
}

export function subtract(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.sub(b);
}

export function multiply(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.mul(b);
}

export function divide(a: DecimalValue, b: DecimalValue): DecimalValue {
  return a.div(b);
}

export function applyTaxRate(amount: DecimalValue, taxRatePercent: DecimalValue): DecimalValue {
  // taxRatePercent is e.g. 18.00 for 18%
  return amount.mul(taxRatePercent).div(100).toDecimalPlaces(4);
}

export function applyDiscountPercentage(amount: DecimalValue, discountPercent: DecimalValue): DecimalValue {
  return amount.mul(discountPercent).div(100).toDecimalPlaces(4);
}

export function formatCurrency(amount: DecimalValue, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount.toNumber());
}

export function generateIdempotencyKey(...parts: string[]): string {
  return parts.join(":");
}

