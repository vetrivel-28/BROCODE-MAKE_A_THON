# BROCODE | MAKE-A-THON 2026

## Client Management Platform

A centralized platform designed to simplify the management of multiple Odoo clients, subscriptions, quotations, and invoices through a single dashboard.


\


---

## About the Project

Managing multiple clients involves handling different accounts, business records, subscriptions, and transactions.

Our project aims to bring these operations together in one centralized platform. It provides administrators with a unified place to manage client information, monitor subscriptions, and track quotations and invoices.

The goal is to make client management more organized, accessible, and efficient.

## Problem Statement

Managing multiple Odoo clients can present several challenges:

- Maintaining client information across different accounts.
- Keeping track of subscriptions and their status.
- Managing quotations and invoices.
- Monitoring client activities.
- Accessing important business information efficiently.

## Our Solution

We are building a centralized platform that simplifies these operations through a single interface.

The platform aims to provide:

- A unified dashboard for client information.
- Centralized client management.
- Subscription tracking.
- Quotation and invoice management.
- Business activity monitoring.

## Key Features

| Feature                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| Authentication          | User registration and secure login.          |
| Dashboard               | Overview of clients and business activities. |
| Client Management       | Manage and maintain client records.          |
| Subscription Management | Track client subscriptions and status.       |
| Quotation Management    | Create and monitor quotations.               |
| Invoice Management      | View and track invoice information.          |
| Analytics               | Present important business insights.         |

*Feature availability depends on the current implementation.*

## Technology Stack

| Area                    | Technologies                    |
| ----------------------- | ------------------------------- |
| Frontend                | React.js, TypeScript, CSS       |
| Backend                 | Node.js, Express.js, TypeScript |
| Version Control         | Git, GitHub                     |
| API Testing             | Postman                         |
| Development Environment | Visual Studio Code              |

## System Architecture

The proposed high-level architecture:

```text
             Administrator
                   |
                   v
             React Frontend
                   |
                   v
                REST API
                   |
                   v
             Node.js Backend
                   |
             +-----+------+
             |            |
             v            v
          Database       API
```

*The architecture will be updated to reflect the final implementation.*

## Project Structure

```text
BROCODE-MAKE_A_THON/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   └── package.json
│
├── README.md
└── .gitignore
```

## Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/vetrivel-28/BROCODE-MAKE_A_THON.git
```

### 2. Navigate to the Project

```bash
cd BROCODE-MAKE_A_THON
```

### 3. Install and Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Install and Run the Backend

Open a separate terminal:

```bash
cd backend
npm install
npm run dev
```

Make sure the required environment variables are configured before starting the backend.

## Development Progress

- [x] Initial project setup
- [x] GitHub repository setup
- [x] Frontend development
- [x] Backend API development
- [x] Database integration
- [x] Authentication
- [x] Client management
- [x] Subscription management
- [x] Quotation and invoice management
- [x] Testing and deployment

## Team

**Team BROCODE**

MAKE-A-THON 2026

| Member   | Responsibility                         |
| -------- | -------------------------------------- |
| Member 1 | Frontend Development                   |
| Member 2 | Backend Development                    |
| Member 3 | Database and Odoo Integration          |
| Member 4 | Testing, Documentation and Integration |

## Contribution Guidelines

We follow a branch-based workflow to keep development organized.

1. Create a separate branch for your task.
2. Implement and test your changes.
3. Commit your changes with a meaningful message.
4. Push your branch to GitHub.
5. Create a Pull Request for review.

Example:

```bash
git checkout -b feature/client-management
git add .
git commit -m "Add client management module"
git push origin feature/client-management
```

---

## Project Status

BROCODE is being developed as part of MAKE-A-THON 2026.

This repository will be updated as new features, improvements, and integrations are implemented.

**Developed by Team BROCODE**
