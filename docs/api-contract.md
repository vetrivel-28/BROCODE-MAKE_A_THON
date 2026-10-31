# LoopDesk Cross-Module API Contracts

This document specifies the exact contract boundaries agreed upon by all four modules in the LoopDesk monorepo.
Any contract not yet implemented by a peer module must be stubbed in the consumer's module `contracts.ts`.

---

## 1. Person 1 (Identity, Access & Platform Tiers)
Owns: `backend/src/modules/identity/`, `frontend/src/features/identity/`

### Middleware & Context
- **`authorize(...roles: UserRole[])`**
  - Guards routes by user role: `SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`.
  - Attaches authenticated user to `req.user`:
    ```typescript
    req.user: {
      id: string;
      tenantId: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
    }
    ```

### Exported Functions
- **`can(tenantId: string, feature: string): Promise<boolean>`**
  - Checks if the tenant's current platform tier entitles them to a specific feature (e.g. `'auto_billing'`, `'custom_dashboard'`, `'composable_workspace'`).
- **`getTenantTier(tenantId: string): Promise<'FREE' | 'STANDARD' | 'CUSTOM'>`**
  - Returns the tenant's current active tier code.
- **`remainingCustomizationSlots(tenantId: string): Promise<number>`**
  - Computes remaining slots = `tierSlots - usedCustomizationSlots(tenantId)`.
- **`usedCustomizationSlots(tenantId: string): Promise<number>`**
  - Calls P3's customization ledger to get count of slots consumed.

### API Endpoints
- `POST /identity/signup` — Public: Register tenant, ADMIN user, choose tier & starter pack.
- `POST /identity/login` — Public: Authenticate email + password, returns `{ accessToken, refreshToken, user, tenant }`.
- `POST /identity/refresh` — Public: Exchange refresh token for new access token.
- `POST /identity/forgot-password` — Public: Send password reset token (expires in 30 minutes).
- `POST /identity/reset-password` — Public: Reset password using valid token.
- `POST /identity/staff` — ADMIN only: Create employee user with `STAFF` role.
- `POST /identity/customer-user` — ADMIN only: Create customer portal user with `CUSTOMER` role.
- `GET /identity/passport` — Authenticated: Tenant Privilege Passport (tier, slots, locked/unlocked features, upgrade options).
- `POST /identity/upgrade` — ADMIN only: Purchase/upgrade platform tier via Razorpay test mode.

---

## 2. Person 2 (Catalog, Quotations & Subscriptions)
Owns: `backend/src/modules/catalog/`, `backend/src/modules/subscriptions/`, matching frontend features.

### Exported Functions
- **`getApplicableDiscounts(subscriptionId: string, periodStart: Date): Promise<ApplicableDiscount[]>`**
  - Returns `[{ discountId: string, type: 'PERCENT' | 'FIXED', value: number, appliesTo: 'ALL' | 'PRODUCT', lineId?: string }]`.
- **`consumeDiscount(discountId: string, tx: PrismaClient): Promise<void>`**
  - Atomically increments discount used count; fails if limit reached.
- **`addAuditEvent(subscriptionId: string, type: string, meta: Record<string, any>): Promise<void>`**
  - Records an event in the Subscription Timeline.
- **`advanceNextInvoiceDate(subscriptionId: string, tx: PrismaClient): Promise<Date>`**
  - Increments `nextInvoiceDate` based on subscription plan cycle.
- **`getSeatSuggestion(subscriptionId: string): Promise<{ suggestedDiscountId?: string; message?: string }>`**
  - Smart Discount Engine suggestion on seat addition.
- **`Subscription Model`**:
  - `status`: `'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED'`
  - `planId`, `customerId`, `startDate`, `expiryDate`, `paymentTerms` (days), `nextInvoiceDate`, `lines`.

---

## 3. Person 3 (Billing, Payments & Customization Wallet)
Owns: `backend/src/modules/billing/`, `backend/src/modules/payments/`, matching frontend features.

### Exported Functions & API Endpoints
- **`generateInvoice(subscriptionId: string, periodStart: Date, tx: PrismaClient): Promise<Invoice>`**
  - Generates immutable invoice from subscription lines and discounts.
- `GET /billing/summary?from=&to=` — Summary counts, invoiced, collected, outstanding, overdue amount & count, monthly revenue.
- `GET /billing/overdue` — List of overdue invoices with days overdue and Revenue at Risk.
- `GET /wallet` — Tenant customization wallet balance and transaction ledger.
- `GET /customizations/catalog` — List of 10 available customizations with price in paise.
- `POST /customizations/purchase` — Purchase customization (enforces wallet balance & tier slot limits).
- `POST /customizations/bundle` — Purchase bundle of 5 customizations at discounted price.
- `GET /customizations/history` — Audit trail of purchased customizations.
- `GET /portal/invoices` — Customer portal invoice history (scoped to customer ID).

---

## 4. Person 4 (Website, Design System & Insights)
Owns: `frontend/src/shared/`, `frontend/src/website/`, `frontend/src/app-shell/`, `backend/src/modules/insights/`, `frontend/src/features/insights/`.

### Shared UI System
- Components: `Button`, `Input`, `Table`, `StatusPill`, `Modal`, `Toast`, `Card`, `Pagination`, `EmptyState`.
- API client wrapper with JWT token interceptors.
- App Shell: launcher grid of rounded app tiles, top bar with wallet balance and profile dropdown, route guards.
- Color Tokens:
  - Background: `#F7F8FC`
  - Surface: `#FFFFFF`
  - Text: `#1B1F3B`
  - Primary: `#6C4BFF`
  - Accent: `#00C2A8`
  - Warm: `#FF7A59`
  - Highlight: `#FFC93C`
  - Radius: `16px`

