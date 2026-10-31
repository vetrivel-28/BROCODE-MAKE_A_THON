export interface ProductVariant {
  id: string;
  attribute: string;
  value: string;
  extraPrice: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  salesPrice: string;
  costPrice: string;
  notes: string | null;
  variants: ProductVariant[];
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minimumQuantity: number;
  availableFrom: string | null;
  availableUntil: string | null;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
}

export interface CatalogPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  validityDays: number;
  planId: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  kind: 'FIXED' | 'PERCENT';
  value: string;
  minimumPurchase: string | null;
  minimumQuantity: number | null;
  startsAt: string;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  appliesTo: 'PRODUCTS' | 'SUBSCRIPTIONS';
}
