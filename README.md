# LoopDesk

> B2B Subscription Management SaaS built for the Aether Hackathon.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` based on `.env.example`.
3. Generate Prisma client & seed database:
   ```bash
   npm run prisma:generate
   npm run prisma:seed
   ```
4. Start backend:
   ```bash
   npm run dev:backend
   ```
5. Start frontend:
   ```bash
   npm run dev:frontend
   ```

## Architecture & Monorepo Structure
- `backend/src/modules/identity` — Person 1 (Auth, Tenants, Tiers, Passport, Starter Packs)
- `backend/src/modules/catalog` & `subscriptions` — Person 2 (Catalog, Plans, Subscriptions, Discounts)
- `backend/src/modules/billing` & `payments` — Person 3 (Invoice Engine, Control Room, Dunning, Wallet)
- `backend/src/modules/insights`, `frontend/src/shared`, `app-shell`, `website` — Person 4 (Design System, App Shell, Dashboard)
