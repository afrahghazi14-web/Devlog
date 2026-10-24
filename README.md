# DevLog — Time-Budgeted Incident & Post-Mortem Logger

DevLog is a full-stack developer operations web application for engineering teams to register infrastructure microservices, track production incidents, log time spent on resolutions, and record detailed post-mortems for continuous learning.

Built with a strict **4-layer backend architecture** and a modern **dark-mode developer UI**, DevLog visibly demonstrates advanced database patterns (partial B-Tree indexes, Common Table Expressions, window functions, MVCC transaction guards, and connection pooling) with zero TypeScript and zero MongoDB.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (ES Modules, `type: module`), Express 5, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL |
| **Frontend** | React 19 (Vite), Tailwind CSS 4, React Router 7, Axios, TanStack Query 5, React Hook Form 7 |
| **Testing** | Node.js native test runner (`node:test`, `assert/strict`), native `fetch` |
| **Database** | PostgreSQL 16+ with B-Tree indexes, partial indexes, and ACID transactional isolation |

---

## Prerequisites

Before setting up DevLog, ensure you have the following installed on your machine:
1. **Node.js**: `v20.x` or higher (tested on Node v20/v22/v25).
2. **PostgreSQL**: `v14` or higher running locally on port `5432`.
3. **npm**: `v9.x` or higher.

---

## Step-by-Step Setup Guide

### 1. Database Creation
Create a local PostgreSQL database named `Devlog` using `psql` or pgAdmin:

```sql
CREATE DATABASE "Devlog";
```

*(Note: The database name is case-sensitive; please use capital `D` as `Devlog`)*.

---

### 2. Backend Configuration & Startup

1. Open a terminal and navigate into the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

   Open `.env` and fill in your local PostgreSQL username and password in `DATABASE_URL`:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/Devlog?schema=public"
   FRONTEND_URL="http://localhost:5173"
   ```

4. Generate Prisma client & deploy database migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
   *This compiles the Prisma client driver and applies the database schema, enums, table constraints, and the partial B-Tree index on open incidents.*

5. Seed initial starter data:
   ```bash
   npm run seed
   ```
   *Inserts 3 starter services (`User Auth`, `Billing Engine`, `Notification API`) and 3 incidents (2 OPEN, 1 RESOLVED with a 90-minute post-mortem).*

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend starts at `http://localhost:4000` with hot-reloading.*

---

### 3. Frontend Setup & Startup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Vite starts the React application at `http://localhost:5173/`.*

4. Open your browser and navigate to:
   👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## How to Run Tests

### Backend Automated Test Suite
DevLog includes an end-to-end integration test suite covering health checks, CRUD operations, transactions, race conditions, pagination, filtering, and analytics without third-party test runners:

```bash
cd backend
npm test
```
*Expected result: 13 / 13 tests passing.*

### Performance & Bulk Data Benchmarks
To test performance with realistic high-volume data:

```bash
cd backend

# Insert ~20,000 incidents with post-mortems (~3.8s)
npm run seed:bulk

# Reset database back to clean 3 + 3 baseline at any time
npm run seed:reset
```

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for full `EXPLAIN ANALYZE` benchmarks, query plans, and index footprint comparisons.

### Frontend Production Build
To verify the frontend compiles cleanly:

```bash
cd frontend
npm run build
```

---

## Folder Structure

```text
Devlog/
├── README.md                  # Project overview and setup instructions
├── REPORT.md                  # Comprehensive academic project report
├── SYLLABUS_MAPPING.md        # Line-by-line curriculum requirement mapping
├── VIVA_PREP.md               # Viva defense questions and detailed answers
├── DEMO_SCRIPT.md             # 5-minute timed live demonstration walkthrough
├── SUBMISSION_CHECKLIST.md    # Pre-submission verification audit and spot checks
├── database/                  # SQL database backup and restoration instructions
│   ├── devlog_schema_and_seed.sql # Complete PostgreSQL pg_dump (schema + data)
│   └── README.txt             # Instructions for restoring with psql
├── screenshots/               # Application walkthrough screenshots
│   ├── 01-dashboard.png
│   ├── 02-incident-tabs.png
│   ├── 03-add-incident-modal.png
│   ├── 04-incident-added.png
│   ├── 05-resolve-modal.png
│   ├── 06-resolve-conflict-409.png
│   ├── 07-postmortem-view.png
│   ├── 08-services-page.png
│   ├── 09-service-stats-card.png
│   ├── 10-prisma-studio-tables.png
│   └── README.txt             # Numbered screenshot descriptions
├── docs/                      # Engineering documentation
│   ├── PROJECT_BRIEF.md       # Project brief and syllabus requirements
│   ├── PROGRESS.md            # Detailed phase-by-phase implementation log
│   ├── API.md                 # Complete REST API reference
│   └── PERFORMANCE.md         # EXPLAIN ANALYZE benchmarks and architecture notes
├── backend/                   # Express backend application
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma models and enums
│   │   ├── migrations/        # SQL migration history (includes partial index)
│   │   ├── seed.js            # Normal 3 + 3 starter seed script
│   │   └── seed-bulk.js       # 20,000-incident bulk benchmark generator
│   ├── prisma.config.js       # Prisma 7 configuration file
│   ├── tests/
│   │   └── api.test.js        # Node native test suite (13 automated tests)
│   └── src/
│       ├── config/            # Database and environment configuration
│       ├── controllers/       # HTTP request handlers (status codes, JSON serialization)
│       ├── errors/            # Custom AppError and error definitions
│       ├── middleware/        # Rate limiting, error handling, async wrappers
│       ├── repositories/      # Database layer (ONLY place Prisma is imported)
│       ├── routes/            # Express route definitions under /api/v1
│       ├── services/          # Business logic and atomic transactions
│       ├── app.js             # Express app setup (CORS, Helmet, rate limiting)
│       └── server.js          # HTTP server listener
└── frontend/                  # Vite + React frontend application
    ├── src/
    │   ├── api/               # Axios instance and API client functions
    │   ├── components/        # Reusable UI library (Modals, Pills, Badges, Cards)
    │   ├── hooks/             # Custom React Query query and mutation hooks
    │   ├── layouts/           # AppLayout with navigation header and ErrorBoundary
    │   ├── pages/             # DashboardPage and ServicesPage
    │   ├── App.jsx            # QueryClientProvider, Router, and routes
    │   └── main.jsx           # React DOM root entry
    ├── vite.config.js         # Vite configuration with Tailwind CSS plugin
    └── package.json           # Frontend dependencies and scripts
```

---

## API Overview

All endpoints live under `/api/v1`. Comprehensive request and response schemas are documented in [docs/API.md](docs/API.md).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check (returns database status `up`) |
| `GET` | `/api/v1/services` | List all registered services ordered alphabetically |
| `POST` | `/api/v1/services` | Register a new service (`name` + `environment`) |
| `GET` | `/api/v1/incidents` | List incidents with filtering (`status`) and pagination (`page`, `limit`) |
| `POST` | `/api/v1/incidents` | Log a new incident (`serviceId`, `title`, `description`, `severity`) |
| `GET` | `/api/v1/incidents/:id` | Fetch full incident details including service and post-mortem |
| `POST` | `/api/v1/incidents/:id/resolve` | Atomic transaction: resolves incident & creates post-mortem |
| `GET` | `/api/v1/stats` | Dashboard summary metrics (active, high severity open, total time) |
| `GET` | `/api/v1/stats/services` | Analytics: services ranked by resolution time with CTE & window function |

---

## Key Architectural & DBMS Highlights

1. **Strict 4-Layer Separation**:
   - `routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `repositories`.
   - Only repository files import `prisma` and communicate with PostgreSQL.
2. **Atomic Resolve & Concurrency Protection**:
   - Resolving an incident executes inside `prisma.$transaction`.
   - An atomic `updateMany` condition (`WHERE id = :id AND status = 'OPEN'`) uses PostgreSQL's row-level locking under Read Committed isolation to prevent duplicate resolutions (returns `409 Conflict` if two users resolve simultaneously).
3. **Partial B-Tree Index**:
   - `CREATE INDEX "Incident_open_createdAt_idx" ON "Incident" ("createdAt" DESC) WHERE status = 'OPEN'`.
   - Reduces dashboard query execution time from 1.51 ms to 0.04 ms (**35x faster**) and requires only **40 kB** in RAM compared to **632 kB** for a full index.
4. **CTE & Window Function Analytics**:
   - Computes service rankings using `WITH service_metrics AS (...)` and `RANK() OVER (ORDER BY "totalMinutesSpent" DESC)::INTEGER AS rank`.
5. **Zero N+1 Query Overhead**:
   - In [incident.repository.js](backend/src/repositories/incident.repository.js), relational queries use `include: { service: true }`, which batches service lookups in constant $O(1)$ roundtrips.
6. **Bounded Connection Pooling**:
   - A single shared `PrismaClient` is exported across the app, preventing PostgreSQL connection exhaustion.
