# BROCODE-MAKE_A_THON

## LoopDesk

B2B Subscription Management SaaS — Phase 0 project foundation.

## Requirements

- Node.js 22 or newer and npm
- PostgreSQL (only needed when connecting Prisma to a database; Phase 0 does not run migrations)

## Setup

Install dependencies in each application:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
```

Set `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string. Environment variables are validated when the backend starts.

In another terminal:

```powershell
cd frontend
npm install
```

## Run locally

Start the backend from `backend/`:

```powershell
npm run dev
```

Start the frontend from `frontend/`:

```powershell
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). The homepage checks the backend at `http://localhost:3001/api/health`. Configure `FRONTEND_URL` in the backend environment if the frontend origin differs.

Test the health endpoint:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

The endpoint returns `{"status":"ok"}`. No authentication, business features, database models, or migrations are included in Phase 0.