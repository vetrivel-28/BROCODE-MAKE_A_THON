import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlatformPlans(db: PrismaClient = prisma) {
  console.log('Seeding Platform Plans and Entitlements...');

  // 1. Free Tier (Rs 0)
  const freePlan = await db.platformPlan.upsert({
    where: { tierCode: 'FREE' },
    update: {},
    create: {
      tierCode: 'FREE',
      name: 'Free',
      priceMonthlyPaise: 0,
      priceYearlyPaise: 0,
      customizationSlots: 0,
      description: 'One app, unlimited users, fixed template, manual invoice sending, 0 customization slots.'
    }
  });

  const freeEntitlements = [
    { featureKey: 'single_app', description: 'Single core app access' },
    { featureKey: 'manual_billing', description: 'Manual invoice sending' }
  ];

  for (const ent of freeEntitlements) {
    await db.entitlement.upsert({
      where: {
        platformPlanId_featureKey: {
          platformPlanId: freePlan.id,
          featureKey: ent.featureKey
        }
      },
      update: {},
      create: {
        platformPlanId: freePlan.id,
        featureKey: ent.featureKey,
        description: ent.description
      }
    });
  }

  // 2. Standard Tier (Rs 580 / month = 58,000 paise)
  const standardPlan = await db.platformPlan.upsert({
    where: { tierCode: 'STANDARD' },
    update: {},
    create: {
      tierCode: 'STANDARD',
      name: 'Standard',
      priceMonthlyPaise: 58000,
      priceYearlyPaise: 58000 * 10, // 2 months free yearly incentive
      customizationSlots: 2,
      description: 'All core apps, general template, automated billing, 2 customization slots, basic dashboard.'
    }
  });

  const standardEntitlements = [
    { featureKey: 'all_core_apps', description: 'Access to all core apps' },
    { featureKey: 'auto_billing', description: 'Fully automated billing cycles' },
    { featureKey: 'auto_invoices', description: 'Automatic invoice generation' },
    { featureKey: 'auto_taxes', description: 'Automated tax calculation' },
    { featureKey: 'auto_discounts', description: 'Smart discount engine application' },
    { featureKey: 'auto_reminders', description: 'Autopilot dunning reminders' },
    { featureKey: 'basic_dashboard', description: 'Standard revenue dashboard' }
  ];

  for (const ent of standardEntitlements) {
    await db.entitlement.upsert({
      where: {
        platformPlanId_featureKey: {
          platformPlanId: standardPlan.id,
          featureKey: ent.featureKey
        }
      },
      update: {},
      create: {
        platformPlanId: standardPlan.id,
        featureKey: ent.featureKey,
        description: ent.description
      }
    });
  }

  // 3. Custom Tier (Rs 1,080 / month = 108,000 paise)
  const customPlan = await db.platformPlan.upsert({
    where: { tierCode: 'CUSTOM' },
    update: {},
    create: {
      tierCode: 'CUSTOM',
      name: 'Custom',
      priceMonthlyPaise: 108000,
      priceYearlyPaise: 108000 * 10,
      customizationSlots: 10,
      description: 'Composable workspace, advanced roles, custom dashboards & exports, 10 customization slots.'
    }
  });

  const customEntitlements = [
    ...standardEntitlements,
    { featureKey: 'composable_workspace', description: 'Pick and compose modules freely' },
    { featureKey: 'advanced_roles', description: 'Fine-grained permissions and custom roles' },
    { featureKey: 'custom_dashboards', description: 'Custom widgets and layouts' },
    { featureKey: 'custom_exports', description: 'Advanced reporting and CSV/PDF exports' }
  ];

  for (const ent of customEntitlements) {
    await db.entitlement.upsert({
      where: {
        platformPlanId_featureKey: {
          platformPlanId: customPlan.id,
          featureKey: ent.featureKey
        }
      },
      update: {},
      create: {
        platformPlanId: customPlan.id,
        featureKey: ent.featureKey,
        description: ent.description
      }
    });
  }

  console.log('Platform plans and entitlements seeded successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedPlatformPlans()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

