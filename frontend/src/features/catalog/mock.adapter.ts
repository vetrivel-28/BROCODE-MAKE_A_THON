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

const today = new Date();
const dateAt = (days: number) => new Date(today.getTime() + days * 86_400_000).toISOString();
const makeProduct = (
  id: string,
  name: string,
  type: string,
  price: string,
  cost: string,
  variants: Product['variants'] = [],
): Product => ({ id, name, type, salesPrice: price, costPrice: cost, notes: null, variants });
const makePlan = (
  id: string,
  name: string,
  price: string,
  minimumQuantity: number,
  flags: Pick<Plan, 'autoClose' | 'closable' | 'pausable' | 'renewable'>,
): Plan => ({
  id, name, price, minimumQuantity, billingPeriod: 'MONTHLY',
  availableFrom: null, availableUntil: null, ...flags,
});

export const mockCatalogState: {
  products: Product[];
  plans: Plan[];
  templates: QuotationTemplate[];
  discounts: DiscountRule[];
} = {
  products: [
    makeProduct('prd-odoo', 'Odoo implementation', 'SERVICE', '18500.00', '9200.00', [
      { id: 'var-odoo-brand', attribute: 'Brand', value: 'Odoo', extraPrice: '560.00' },
      { id: 'var-odoo-support', attribute: 'Support', value: 'Premium', extraPrice: '1250.00' },
    ]),
    makeProduct('prd-onboarding', 'Business onboarding', 'SERVICE', '7500.00', '3200.00'),
    makeProduct('prd-analytics', 'Analytics add-on', 'ADD_ON', '1200.00', '240.00'),
    makeProduct('prd-training', 'Team training', 'SERVICE', '4500.00', '1800.00'),
    makeProduct('prd-domain', 'Custom domain', 'ADD_ON', '800.00', '150.00'),
    makeProduct('prd-migration', 'Data migration', 'SERVICE', '12500.00', '6400.00'),
    makeProduct('prd-api', 'API access', 'ADD_ON', '950.00', '180.00'),
    makeProduct('prd-support', 'Priority support', 'SERVICE', '2200.00', '550.00'),
  ],
  plans: [
    makePlan('pln-free', 'Free', '0.00', 1, { autoClose: true, closable: true, pausable: false, renewable: true }),
    makePlan('pln-standard', 'Standard', '580.00', 1, { autoClose: false, closable: true, pausable: true, renewable: true }),
    makePlan('pln-custom', 'Custom', '1080.00', 3, { autoClose: false, closable: true, pausable: true, renewable: true }),
    makePlan('pln-growth', 'Growth annual', '9600.00', 5, { autoClose: true, closable: true, pausable: false, renewable: true }),
  ],
  templates: [],
  discounts: [
    {
      id: 'dsc-seat-saver', name: 'Seat saver', kind: 'PERCENT', value: '10.00',
      minimumPurchase: '5000.00', minimumQuantity: 5, startsAt: dateAt(-120), endsAt: dateAt(120),
      usageLimit: 80, usageCount: 12, appliesTo: 'SUBSCRIPTIONS', productIds: [],
    },
    {
      id: 'dsc-onboarding', name: 'Onboarding bundle', kind: 'FIXED', value: '1000.00',
      minimumPurchase: '3000.00', minimumQuantity: 1, startsAt: dateAt(-30), endsAt: dateAt(45),
      usageLimit: 30, usageCount: 9, appliesTo: 'PRODUCTS', productIds: ['prd-onboarding'],
    },
    {
      id: 'dsc-loyalty', name: 'Loyal customer', kind: 'PERCENT', value: '5.00',
      minimumPurchase: '10000.00', minimumQuantity: 1, startsAt: dateAt(-60), endsAt: dateAt(90),
      usageLimit: null, usageCount: 27, appliesTo: 'SUBSCRIPTIONS', productIds: [],
    },
    {
      id: 'dsc-expired', name: 'Launch offer', kind: 'PERCENT', value: '15.00',
      minimumPurchase: null, minimumQuantity: null, startsAt: dateAt(-180), endsAt: dateAt(-5),
      usageLimit: 100, usageCount: 52, appliesTo: 'SUBSCRIPTIONS', productIds: [],
    },
    {
      id: 'dsc-exhausted', name: 'Founders offer', kind: 'FIXED', value: '2500.00',
      minimumPurchase: null, minimumQuantity: 1, startsAt: dateAt(-20), endsAt: dateAt(30),
      usageLimit: 5, usageCount: 5, appliesTo: 'SUBSCRIPTIONS', productIds: [],
    },
    {
      id: 'dsc-migration', name: 'Migration special', kind: 'PERCENT', value: '8.00',
      minimumPurchase: '12000.00', minimumQuantity: 1, startsAt: dateAt(-10), endsAt: dateAt(60),
      usageLimit: 20, usageCount: 4, appliesTo: 'PRODUCTS', productIds: ['prd-migration'],
    },
  ],
};

function page<T>(items: T[], options: { cursor?: string; take?: number }): CatalogPage<T> {
  const start = options.cursor ? Number(options.cursor) : 0;
  const take = options.take ?? 20;
  const slice = items.slice(start, start + take);
  return { items: slice, nextCursor: start + take < items.length ? String(start + take) : null };
}

function matchesSearch(text: string, search?: string) {
  return !search || text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
}

function requireValidDecimal(value: string, label: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || !Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a non-negative amount with up to two decimals`);
  }
}

mockCatalogState.templates = [
  { id: 'tpl-standard', name: 'Standard onboarding', validityDays: 30, planId: 'pln-standard' },
  { id: 'tpl-custom', name: 'Custom workspace launch', validityDays: 21, planId: 'pln-custom' },
  { id: 'tpl-growth', name: 'Growth annual rollout', validityDays: 14, planId: 'pln-growth' },
].map((template, index) => ({
  ...template,
  plan: mockCatalogState.plans.find((plan) => plan.id === template.planId),
  lines: [{
    id: `tpl-line-${index + 1}`,
    productId: index === 1 ? 'prd-odoo' : 'prd-onboarding',
    quantity: 1,
    unitPrice: index === 1 ? '18500.00' : '7500.00',
    taxRate: '18.00',
    amount: index === 1 ? '18500.00' : '7500.00',
    taxAmount: index === 1 ? '3330.00' : '1350.00',
    product: mockCatalogState.products[index === 1 ? 0 : 1],
  }],
}));

export const mockCatalogApi = {
  async products(options: { cursor?: string; take?: number; search?: string; type?: string } = {}) {
    const filtered = mockCatalogState.products.filter((product) =>
      matchesSearch(`${product.name} ${product.type}`, options.search)
      && (!options.type || product.type === options.type));
    return page(filtered, options);
  },
  async createProduct(input: ProductInput): Promise<Product> {
    if (!input.name.trim() || !input.type.trim()) throw new Error('Name and type are required');
    requireValidDecimal(input.salesPrice, 'Sales price');
    requireValidDecimal(input.costPrice, 'Cost price');
    input.variants.forEach((variant) => {
      if (!variant.attribute.trim() || !variant.value.trim()) throw new Error('Each variant needs an attribute and value');
      requireValidDecimal(variant.extraPrice, 'Variant extra price');
    });
    const product: Product = {
      ...input,
      id: `prd-${crypto.randomUUID()}`,
      name: input.name.trim(),
      type: input.type.trim(),
      notes: input.notes?.trim() || null,
      variants: input.variants.map((variant) => ({ ...variant, id: `var-${crypto.randomUUID()}` })),
    };
    mockCatalogState.products.unshift(product);
    return product;
  },
  async plans(options: { cursor?: string; take?: number; search?: string } = {}) {
    return page(mockCatalogState.plans.filter((plan) => matchesSearch(plan.name, options.search)), options);
  },
  async createPlan(input: PlanInput): Promise<Plan> {
    requireValidDecimal(input.price, 'Plan price');
    if (!Number.isInteger(input.minimumQuantity) || input.minimumQuantity < 1) throw new Error('Minimum quantity must be at least one');
    const plan: Plan = { ...input, id: `pln-${crypto.randomUUID()}`, availableFrom: input.availableFrom ?? null, availableUntil: input.availableUntil ?? null };
    if (
      (plan.availableFrom && !Number.isFinite(new Date(plan.availableFrom).getTime()))
      || (plan.availableUntil && !Number.isFinite(new Date(plan.availableUntil).getTime()))
    ) throw new Error('Availability dates must be valid');
    if (plan.availableFrom && plan.availableUntil && new Date(plan.availableUntil) < new Date(plan.availableFrom)) {
      throw new Error('Availability end date must be on or after the start date');
    }
    mockCatalogState.plans.unshift(plan);
    return plan;
  },
  async templates(options: { cursor?: string; take?: number; search?: string } = {}) {
    return page(mockCatalogState.templates.filter((template) => matchesSearch(template.name, options.search)), options);
  },
  async createTemplate(input: QuotationTemplateInput): Promise<QuotationTemplate> {
    if (!input.name.trim() || !Number.isInteger(input.validityDays) || input.validityDays < 1) {
      throw new Error('Template name and positive validity days are required');
    }
    const plan = mockCatalogState.plans.find((candidate) => candidate.id === input.planId);
    if (!plan) throw new Error('Choose an existing plan');
    const lines = input.lines.map((line, index) => {
      const product = mockCatalogState.products.find((candidate) => candidate.id === line.productId);
      if (!product) throw new Error('Choose an existing product for every line');
      if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('Line quantity must be at least one');
      requireValidDecimal(line.unitPrice, 'Unit price');
      requireValidDecimal(line.taxRate, 'Tax rate');
      if (Number(line.taxRate) > 100) throw new Error('Tax rates cannot exceed 100%');
      const amount = (Number(line.unitPrice) * line.quantity).toFixed(2);
      return {
        ...line,
        id: `tpl-line-${crypto.randomUUID()}-${index}`,
        amount,
        taxAmount: (Number(amount) * Number(line.taxRate) / 100).toFixed(2),
        product,
      };
    });
    const template: QuotationTemplate = {
      ...input,
      id: `tpl-${crypto.randomUUID()}`,
      name: input.name.trim(),
      plan,
      lines,
    };
    mockCatalogState.templates.unshift(template);
    return template;
  },
  async discounts(options: { cursor?: string; take?: number; search?: string } = {}) {
    return page(mockCatalogState.discounts.filter((discount) => matchesSearch(discount.name, options.search)), options);
  },
  async createDiscount(input: DiscountInput): Promise<DiscountRule> {
    return saveDiscount(input);
  },
  async updateDiscount(id: string, input: DiscountInput): Promise<DiscountRule> {
    return saveDiscount(input, id);
  },
  async seatSuggestions(currentSeats: number, suggestedSeats: number) {
    if (
      !Number.isInteger(currentSeats)
      || !Number.isInteger(suggestedSeats)
      || currentSeats < 0
      || suggestedSeats < 1
      || suggestedSeats < currentSeats
    ) {
      throw new Error('Suggested seats must be a whole number at least as large as current seats');
    }
    const eligibleDiscounts = mockCatalogState.discounts.filter((discount) =>
      discount.appliesTo === 'SUBSCRIPTIONS'
      && discount.minimumQuantity !== null
      && suggestedSeats >= discount.minimumQuantity
      && currentSeats < discount.minimumQuantity
      && discount.usageCount < (discount.usageLimit ?? Number.POSITIVE_INFINITY)
      && new Date(discount.startsAt) <= today
      && (!discount.endsAt || new Date(discount.endsAt) >= today));
    return { currentSeats, suggestedSeats, incrementalSeats: Math.max(0, suggestedSeats - currentSeats), eligibleDiscounts };
  },
};

function saveDiscount(input: DiscountInput, id?: string): DiscountRule {
  requireValidDecimal(input.value, 'Discount value');
  if (input.kind === 'PERCENT' && Number(input.value) > 100) throw new Error('Percent discounts cannot exceed 100%');
  if (input.minimumPurchase) requireValidDecimal(input.minimumPurchase, 'Minimum purchase');
  if (
    input.minimumQuantity !== null
    && input.minimumQuantity !== undefined
    && (!Number.isInteger(input.minimumQuantity) || input.minimumQuantity < 1)
  ) throw new Error('Minimum quantity must be a positive whole number');
  if (!input.name.trim() || !Number.isFinite(new Date(input.startsAt).getTime())) throw new Error('Name and valid start date are required');
  if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('End date must be after start date');
  if (input.usageLimit !== null && input.usageLimit !== undefined && (!Number.isInteger(input.usageLimit) || input.usageLimit < 1)) {
    throw new Error('Usage limit must be a positive whole number');
  }
  if (input.appliesTo === 'PRODUCTS' && input.productIds.length === 0) throw new Error('Choose at least one product');
  const existing = id ? mockCatalogState.discounts.find((rule) => rule.id === id) : undefined;
  if (id && !existing) throw new Error('Discount rule not found');
  if (
    existing
    && input.usageLimit !== null
    && input.usageLimit !== undefined
    && input.usageLimit < existing.usageCount
  ) throw new Error('Usage limit cannot be lower than the current usage count');
  const rule: DiscountRule = {
    ...input,
    id: id ?? `dsc-${crypto.randomUUID()}`,
    name: input.name.trim(),
    minimumPurchase: input.minimumPurchase ?? null,
    minimumQuantity: input.minimumQuantity ?? null,
    endsAt: input.endsAt ?? null,
    usageLimit: input.usageLimit ?? null,
    usageCount: existing?.usageCount ?? 0,
  };
  if (existing) mockCatalogState.discounts.splice(mockCatalogState.discounts.indexOf(existing), 1, rule);
  else mockCatalogState.discounts.unshift(rule);
  return rule;
}
