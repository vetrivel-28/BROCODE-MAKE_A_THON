# LoopDesk Architecture

## Overview
LoopDesk is a multi-tenant B2B Subscription Management SaaS enabling business owners to run subscriptions, automated billing, payments, and revenue analytics.

```
[ Public Website & App Shell (P4) ]
   |
   +---> Auth / Identity / Tiers (P1)
   |        |
   |        +--> Privilege Passport & Tiers (Free, Standard, Custom)
   |        +--> Industry Starter Packs
   |
   +---> Catalog & Subscriptions (P2)
   |        |
   |        +--> Products & Plans
   |        +--> Quotations & Subscriptions
   |        +--> Smart Discount Engine & Audit Timeline
   |
   +---> Billing & Payments (P3)
   |        |
   |        +--> Invoice Engine & Taxes
   |        +--> Billing Day Control Room & Autopilot Dunning
   |        +--> Razorpay Payments & Customization Wallet
   |
   +---> Revenue Intelligence (P4)
            |
            +--> MRR, ARR, Churn, Forecast
            +--> Customer Health Score
            +--> Customization Studio
```

## Shared Architectural Invariants
1. **Integer Money**: All monetary amounts stored as integer paise (INR). Never floats.
2. **Tenant Isolation**: Every database row has a `tenantId`. Every query is strictly filtered by `tenantId`.
3. **Deterministic Clock**: `clock.now()` allows injecting `x-test-date` header in non-production environments to test billing dates, grace periods, and dunning cycles.
4. **Prisma Transactions**: All multi-step mutations run in transactional context (`prisma.$transaction`).
5. **Standard Error Shape**:
   ```json
   {
     "error": {
       "code": "ERROR_CODE",
       "message": "Human readable message",
       "details": {}
     }
   }
   ```
