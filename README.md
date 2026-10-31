Subscription Management System
A unified platform for managing products, subscription plans, customer
subscriptions, recurring billing, invoices, payments, and revenue
insights.

The project is organized as a frontend and backend application. It is
designed to help businesses replace spreadsheet-based subscription
tracking and manual billing workflows with a centralized system.
Key Features
Identity and Access Management
- Customer and staff authentication.
- Role-based access control.
- Privilege-based access to application features.
- Tenant-aware access boundaries.
- Password validation and authentication workflows.
Subscription and Product Management
- Centralized product and subscription information.
- Subscription lifecycle management.
- Support for configurable subscription plans and billing periods.
- Customer-specific subscription visibility.
Billing and Invoices
- Invoice management and billing workflows.
- Tax calculation support.
- Invoice status and balance reconciliation.
- API endpoints for billing operations.
Payments
- Record customer payments.
- Associate payments with invoices.
- Reconcile invoice balances.
- Track paid and outstanding amounts.
Dashboard and Insights
- Dashboard views for operational and financial information.
- Subscription and billing insights.
- Centralized visibility into key business activity.
Technology Stack
The repository contains a TypeScript-based backend and a React/Vite
frontend.

  Layer        Technologies
  Frontend     React, TypeScript, Vite, Tailwind CSS
Backend      Node.js, TypeScript
Data layer   Prisma
API          REST-style application endpoints
Confirm the exact database, authentication providers, and package
versions from the project configuration before documenting them here.

Repository Structure
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app.ts
│       ├── index.ts
│       ├── seed.ts
│       └── modules/
│           ├── billing/
│           ├── identity/
│           └── payments/
├── frontend/
│   └── src/
│       └── features/
│           ├── identity/
│           └── insights/
├── package-lock.json
└── README.md
The structure above highlights the main areas identified in the project.
Additional files and modules may exist.
Getting Started
Prerequisites
Install the tools required by the project:
- Node.js (use the version specified by the project, if provided).
- npm.
- Git.
- A database supported by the Prisma schema.
1. Clone the repository
git clone https://github.com/vetrivel-28/BROCODE-MAKE_A_THON.git
cd BROCODE-MAKE_A_THON
2. Install dependencies
Install dependencies in the root and in each application directory that
contains its own package.json.
npm install
If backend/ or frontend/ has a separate package.json, install its
dependencies as well:
cd backend
npm install
cd ../frontend
npm install
cd ..
3. Configure environment variables
Create the required environment files based on the variables read by the
backend and frontend.

Do not commit real passwords, API keys, database credentials, tokens, or
other secrets. If the repository provides .env.example files, copy
them and fill in local values.
4. Configure the database
Review backend/prisma/schema.prisma and configure the database
connection using the environment variable expected by the Prisma schema.

Run the Prisma commands defined by the backend project scripts. For
example, where supported:
npx prisma generate
npx prisma migrate dev
5. Start the applications
Use the scripts defined in the relevant package.json files. Common
Vite and Node development commands may look like:
npm run dev
The exact commands and ports depend on the scripts and configuration in
this repository.
Development Notes
- Keep frontend and backend environment variables separate where
  appropriate.
- Never expose private credentials in frontend code.
- Enforce authorization checks on the backend; frontend route
  protection alone is not sufficient.
- Preserve tenant and customer data boundaries in every API operation.
- Add tests when changing identity, billing, payment, or
  access-control behavior.
Security
- Do not commit .env files or secrets.
- Validate and authorize requests on the server.
- Apply least-privilege access for administrative and staff
  operations.
- Ensure customers can access only their own records.
- Review dependencies and keep them updated.
Contributing
1. Create a feature branch from the agreed base branch.
2. Make focused changes.
3. Run the available tests and checks.
4. Review the staged files before committing.
5. Submit changes through the team's agreed review process.
Project Repository
GitHub --
BROCODE-MAKE_A_THON
License
No license information has been specified in this README. Add the
project's chosen license before distributing or reusing the software.
