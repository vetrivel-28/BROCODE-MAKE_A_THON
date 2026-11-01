# BROCODE | MAKE-A-THON 2026

# Odoo Client Management Platform

A centralized platform for managing Odoo clients, subscriptions, quotations, and invoices through a single dashboard.

\<p align="center">
&#x20; \<img src="[https://img.shields.io/badge/Project-MAKE--A--THON-2563EB?style=flat-square](https://img.shields.io/badge/Project-MAKE--A--THON-2563EB?style=flat-square)" />
&#x20; \<img src="[https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)" />
&#x20; \<img src="[https://img.shields.io/badge/Team-BROCODE-111827?style=flat-square](https://img.shields.io/badge/Team-BROCODE-111827?style=flat-square)" />
\</p>

---

## About the Project

Managing multiple Odoo clients can involve handling different accounts, business records, subscriptions, and transactions.

Our project aims to simplify this process by providing a centralized platform where administrators can manage and monitor multiple Odoo clients from one place.

The platform is designed to improve visibility, reduce manual administrative work, and make client-related operations easier to manage.

## Problem Statement

Managing multiple clients across separate Odoo environments can create challenges such as:

- Difficulty maintaining centralized client information.
- Tracking subscriptions and their status.
- Managing quotations and invoices efficiently.
- Monitoring client activity and business operations.
- Accessing important information across different client accounts.

## Our Approach

We are developing a unified management platform that brings essential client management operations together.

The system aims to provide administrators with a clear overview of their clients and the ability to manage important business activities through a single interface.

## Key Features

| Module                  | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| Authentication          | Secure user registration and login.                     |
| Dashboard               | Overview of client information and business activities. |
| Client Management       | Add, view, update, and manage client records.           |
| Subscription Management | Track client subscriptions and their status.            |
| Quotation Management    | Create and monitor client quotations.                   |
| Invoice Management      | Access and track invoice information.                   |
| Analytics               | Present useful business insights through the dashboard. |

*Features are subject to implementation and integration progress.*

## Technology Stack

**Frontend**

- React.js
- TypeScript
- CSS

**Backend**

- Node.js
- Express.js
- TypeScript

**Development Tools**

- Git and GitHub
- Visual Studio Code
- Postman

**Database and Odoo Integration**

The database and Odoo integration approach will be documented once finalized.

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
    Database    Odoo API
```

The final architecture will depend on the database design and Odoo integration approach.

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

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

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

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Start the Backend

Open a separate terminal:

```bash
cd backend
npm install
npm run dev
```

Configure the required environment variables before running the backend.

## Development Roadmap

- [x] Initial project setup
- [x] GitHub repository setup
- [x] Frontend development
- [x] Backend API development
- [x] Database integration
- [x] Authentication implementation
- [x] Client management module
- [x] Subscription management
- [x] Quotation and invoice management
- [x] Testing and deployment

## Team

**Team BROCODE**

MAKE-A-THON 2026

| Team Member | Responsibility                         |
| ----------- | -------------------------------------- |
| Member 1    | Frontend Development                   |
| Member 2    | Backend Development                    |
| Member 3    | Database and Odoo Integration          |
| Member 4    | Testing, Documentation and Integration |

## Contributing

We follow a branch-based development workflow to keep contributions organized.

1. Create a separate branch for your feature or task.
2. Implement and test your changes.
3. Commit your changes with a meaningful message.
4. Push your branch to GitHub.
5. Open a Pull Request for review.

Example:

```bash
git checkout -b feature/client-management
git add .
git commit -m "Add client management module"
git push origin feature/client-management
```

## Project Status

This project is currently under development as part of MAKE-A-THON 2026.

More features and documentation will be added as development progresses.

---

\<p align="center">
&#x20; Developed by \<strong>Team BROCODE\</strong>
&#x20; \<br/>
&#x20; MAKE-A-THON 2026
\</p>
