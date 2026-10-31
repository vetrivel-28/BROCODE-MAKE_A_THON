import { prisma } from "../src/config/prisma.js";

try {
  const plans = [
    {
      code: "FREE",
      name: "Free",
      description: "Free plan",
      price: 0,
      currency: "INR",
      billingInterval: "ONE_TIME" as const,
      appLimit: 1,
      customizationSlots: 0,
      entitlements: { appLimit: 1, customizationSlots: 0 },
    },
    {
      code: "STANDARD",
      name: "Standard",
      description: "General template",
      price: 580,
      currency: "INR",
      billingInterval: "MONTHLY" as const,
      appLimit: 1,
      customizationSlots: 2,
      entitlements: {
        appLimit: 1,
        customizationSlots: 2,
        template: "general",
      },
    },
    {
      code: "CUSTOM",
      name: "Custom",
      description: "Composable workspace",
      price: 1080,
      currency: "INR",
      billingInterval: "MONTHLY" as const,
      appLimit: 1,
      customizationSlots: 10,
      entitlements: {
        appLimit: 1,
        customizationSlots: 10,
        workspace: "composable",
      },
    },
  ];

  for (const plan of plans) {
    const savedPlan = await prisma.platformPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        appLimit: plan.appLimit,
        customizationSlots: plan.customizationSlots,
        entitlements: plan.entitlements,
        isActive: true,
      },
      create: {
        ...plan,
        isActive: true,
      },
    });

    console.log(`Platform plan ${savedPlan.code} is available.`);
  }
} finally {
  await prisma.$disconnect();
}
