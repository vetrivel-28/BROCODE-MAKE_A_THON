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

export interface ProductInput {
  name: string;
  type: string;
  salesPrice: string;
  costPrice: string;
  notes?: string | null;
  variants: Array<{ attribute: string; value: string; extraPrice: string }>;
}

export interface PlanInput {
  name: string;
  price: string;
  billingPeriod: Plan['billingPeriod'];
  minimumQuantity: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
}

export interface QuotationTemplateLineInput {
  productId: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
}

export interface QuotationTemplateInput {
  name: string;
  validityDays: number;
  planId: string;
  lines: QuotationTemplateLineInput[];
}

export interface DiscountInput {
  name: string;
  kind: 'FIXED' | 'PERCENT';
  value: string;
  minimumPurchase?: string | null;
  minimumQuantity?: number | null;
  startsAt: string;
  endsAt?: string | null;
  usageLimit?: number | null;
  appliesTo: 'PRODUCTS' | 'SUBSCRIPTIONS';
  productIds: string[];
}

export interface QuotationTemplate {
  id: string;
  name: string;
  validityDays: number;
  planId: string;
  plan?: Plan;
  lines?: Array<QuotationTemplateLineInput & { id: string; amount: string; taxAmount: string; product?: Product }>;
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
  productIds: string[];
}
