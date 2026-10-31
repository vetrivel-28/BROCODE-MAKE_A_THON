import { clock } from '../../common/clock.js';
import { AppError } from '../../common/errors.js';

// In-memory catalog store for high performance & standalone demo
export interface ProductItem {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  salesPricePaise: number;
  costPricePaise: number;
  notes?: string;
  variants: Array<{ id: string; name: string; priceModifierPaise: number }>;
  createdAt: Date;
}

export interface PlanItem {
  id: string;
  tenantId: string;
  name: string;
  pricePaise: number;
  billingPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minQuantity: number;
  autoCloseAtEnd: boolean;
  closableEarly: boolean;
  pausable: boolean;
  renewable: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface TemplateItem {
  id: string;
  tenantId: string;
  name: string;
  validityDays: number;
  planId?: string;
  lines: Array<{
    productId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPricePaise: number;
    taxPercent: number;
  }>;
}

const productsStore: ProductItem[] = [];
const plansStore: PlanItem[] = [];
const templatesStore: TemplateItem[] = [];

// Pre-seed demo catalog
function seedInitialCatalog() {
  if (productsStore.length > 0) return;

  const defaultTenant = 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3';

  // 1. Core Software Product with "Brand Odoo" variant (adds Rs 560 = 56,000 paise)
  productsStore.push({
    id: 'prod-saas-core',
    tenantId: defaultTenant,
    name: 'LoopDesk Enterprise Suite',
    type: 'software',
    salesPricePaise: 499900, // Rs 4,999.00
    costPricePaise: 100000,
    notes: 'Primary SaaS platform license',
    variants: [
      { id: 'var-std', name: 'Standard Edition', priceModifierPaise: 0 },
      { id: 'var-odoo', name: 'Brand Odoo Integration', priceModifierPaise: 56000 } // +Rs 560
    ],
    createdAt: new Date()
  });

  productsStore.push({
    id: 'prod-api-addon',
    tenantId: defaultTenant,
    name: 'Developer Webhook & API Add-on',
    type: 'service',
    salesPricePaise: 99900, // Rs 999.00
    costPricePaise: 20000,
    notes: 'High volume API endpoints',
    variants: [],
    createdAt: new Date()
  });

  // Plans
  plansStore.push({
    id: 'plan-monthly-pro',
    tenantId: defaultTenant,
    name: 'Professional Monthly',
    pricePaise: 499900,
    billingPeriod: 'monthly',
    minQuantity: 1,
    autoCloseAtEnd: false,
    closableEarly: true,
    pausable: true,
    renewable: true
  });

  plansStore.push({
    id: 'plan-annual-pro',
    tenantId: defaultTenant,
    name: 'Professional Annual (20% Off)',
    pricePaise: 4799000, // Rs 47,990.00
    billingPeriod: 'yearly',
    minQuantity: 1,
    autoCloseAtEnd: false,
    closableEarly: true,
    pausable: true,
    renewable: true
  });

  // Quotation Template
  templatesStore.push({
    id: 'tmpl-starter-saas',
    tenantId: defaultTenant,
    name: 'SaaS Client Standard Quote',
    validityDays: 30,
    planId: 'plan-monthly-pro',
    lines: [
      {
        productId: 'prod-saas-core',
        productName: 'LoopDesk Enterprise Suite',
        variantName: 'Brand Odoo Integration',
        quantity: 1,
        unitPricePaise: 555900, // 499900 + 56000 = 555900 paise (Rs 5,559)
        taxPercent: 18
      }
    ]
  });
}

seedInitialCatalog();

export class CatalogService {
  constructor() {
    seedInitialCatalog();
  }

  public listProducts(tenantId: string) {
    seedInitialCatalog();
    return productsStore.filter((p) => p.tenantId === tenantId || p.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3');
  }

  public createProduct(tenantId: string, data: any) {
    const product: ProductItem = {
      id: `prod-${Date.now()}`,
      tenantId,
      name: data.name,
      type: data.type || 'software',
      salesPricePaise: Math.round(data.salesPriceInr * 100),
      costPricePaise: Math.round((data.costPriceInr || 0) * 100),
      notes: data.notes,
      variants: (data.variants || []).map((v: any, idx: number) => ({
        id: `var-${Date.now()}-${idx}`,
        name: v.name,
        priceModifierPaise: Math.round((v.priceModifierInr || 0) * 100)
      })),
      createdAt: clock.now()
    };
    productsStore.unshift(product);
    return product;
  }

  public listPlans(tenantId: string) {
    seedInitialCatalog();
    return plansStore.filter((p) => p.tenantId === tenantId || p.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3');
  }

  public createPlan(tenantId: string, data: any) {
    const plan: PlanItem = {
      id: `plan-${Date.now()}`,
      tenantId,
      name: data.name,
      pricePaise: Math.round(data.priceInr * 100),
      billingPeriod: data.billingPeriod || 'monthly',
      minQuantity: data.minQuantity || 1,
      autoCloseAtEnd: Boolean(data.autoCloseAtEnd),
      closableEarly: data.closableEarly !== false,
      pausable: data.pausable !== false,
      renewable: data.renewable !== false
    };
    plansStore.unshift(plan);
    return plan;
  }

  public listTemplates(tenantId: string) {
    seedInitialCatalog();
    return templatesStore.filter((t) => t.tenantId === tenantId || t.tenantId === 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3');
  }

  public createTemplate(tenantId: string, data: any) {
    const tmpl: TemplateItem = {
      id: `tmpl-${Date.now()}`,
      tenantId,
      name: data.name,
      validityDays: data.validityDays || 30,
      planId: data.planId,
      lines: data.lines || []
    };
    templatesStore.unshift(tmpl);
    return tmpl;
  }
}
