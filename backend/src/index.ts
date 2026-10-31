import { app } from './app.js';
import { taxService } from './modules/billing/tax.service.js';

const PORT = process.env.PORT || 4000;

// Seed default taxes on startup
taxService.seedDefaultTaxes('tenant_default').then(() => {
  console.log('Seeded GST 5%, 12%, 18% for default tenant.');
});

app.listen(PORT, () => {
  console.log(`LoopDesk Billing & Payments Service listening on port ${PORT}`);
});
