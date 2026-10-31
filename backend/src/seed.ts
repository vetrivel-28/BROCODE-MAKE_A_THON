import { taxService } from './modules/billing/tax.service.js';
import { mockSubscriptions, mockDiscounts, SubscriptionContract } from './modules/billing/contracts.js';
import { invoiceService } from './modules/billing/invoice.service.js';

export async function seedDemoData(tenantId = 'tenant_default') {
  console.log(`--- Seeding Phase 1 Data for ${tenantId} ---`);

  // 1. Seed Taxes: GST 5%, 12%, 18%
  const taxes = await taxService.seedDefaultTaxes(tenantId);
  console.log(`Seeded ${taxes.length} Tax Rules:`, taxes.map((t) => `${t.name} (${t.rate}%)`).join(', '));

  const gst18 = taxes.find((t) => t.rate === 18) || taxes[0];
  const gst12 = taxes.find((t) => t.rate === 12) || taxes[0];
  const gst5 = taxes.find((t) => t.rate === 5) || taxes[0];

  // 2. Seed 20 Active Subscriptions
  const companies = [
    'Apex Logistics', 'BluePeak Software', 'CloudCraft Systems', 'Delta Financials',
    'EchoStream Media', 'Flux Ventures', 'Gamma Analytics', 'Horizon Tech',
    'Indigo Labs', 'Jupiter Retail', 'Kite Payments', 'Luna AI',
    'Metro Commerce', 'Nexus Networks', 'Orbit Dynamics', 'Pulse Health',
    'Quantum Works', 'Radiant Energy', 'Solaris Cloud', 'Titan Global'
  ];

  const plans = [
    { id: 'plan_free', name: 'Free Tier', billingCycle: 'MONTHLY' as const, price: 0 },
    { id: 'plan_std', name: 'Standard Tier', billingCycle: 'MONTHLY' as const, price: 58000 }, // Rs 580/mo
    { id: 'plan_cust', name: 'Custom Tier', billingCycle: 'MONTHLY' as const, price: 108000 }, // Rs 1080/mo
  ];

  for (let i = 0; i < companies.length; i++) {
    const comp = companies[i];
    const subId = `sub_demo_${String(i + 1).padStart(2, '0')}`;
    const custId = `cust_demo_${String(i + 1).padStart(2, '0')}`;
    const plan = plans[i % plans.length];
    const taxRule = i % 3 === 0 ? gst18 : i % 3 === 1 ? gst12 : gst5;
    const seats = (i % 5) + 1;

    const sub: SubscriptionContract = {
      id: subId,
      tenantId,
      number: `SUB-2026-${String(i + 1).padStart(4, '0')}`,
      status: 'Active',
      customerId: custId,
      customer: {
        id: custId,
        name: comp,
        email: `billing@${comp.toLowerCase().replace(/\s+/g, '')}.com`,
        address: `${100 + i * 5}, MG Road, Bengaluru`,
        taxNumber: `29AAACB${2000 + i}C1Z5`,
      },
      planId: plan.id,
      plan: {
        id: plan.id,
        name: plan.name,
        billingCycle: plan.billingCycle,
        priceInPaise: plan.price,
      },
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2027-10-01'),
      paymentTerms: 15,
      nextInvoiceDate: new Date('2026-11-01'),
      lines: [
        {
          id: `line_${subId}_1`,
          productId: 'prod_subscription_seat',
          productName: `${plan.name} - Seat License`,
          quantity: seats,
          unitPrice: plan.price,
          variantExtraPrice: plan.id === 'plan_cust' ? 56000 : 0, // Rs 560 extra for Odoo brand variant on Custom
          taxId: taxRule.id,
          isTaxInclusive: false,
        },
      ],
    };

    mockSubscriptions.set(subId, sub);

    // Generate initial invoice for first 5 subscriptions to demonstrate invoice list
    if (i < 5) {
      try {
        await invoiceService.generateInvoice(tenantId, {
          subscriptionId: subId,
          periodStart: new Date('2026-10-01'),
        });
      } catch (err) {
        // already exists or generated
      }
    }
  }

  console.log(`Seeded 20 ACTIVE subscriptions for ${tenantId}.`);
  console.log(`Generated demo invoices for the first 5 subscriptions.`);
}

// Auto-run if executed directly
if (process.argv[1]?.includes('seed')) {
  seedDemoData().catch(console.error);
}

