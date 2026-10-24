# DevLog — Time-Budgeted Incident & Post-Mortem Logger

DevLog is a full-stack developer operations web application for small engineering teams to register infrastructure services, track production incidents, log time spent on resolutions, and record detailed post-mortems for continuous learning.

Built with a strict **layered backend architecture** and a modern **dark-mode developer UI**, DevLog visibly demonstrates advanced database patterns (partial indexes, Common Table Expressions, window functions, MVCC transaction guards, and connection pooling) with zero TypeScript and zero MongoDB.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (ES Modules, `type: module`), Express 5, Prisma ORM 7 (`@prisma/adapter-pg`), PostgreSQL |
| **Frontend** | React 19 (Vite), Tailwind CSS 4, React Router 7, Axios, TanStack Query 5, React Hook Form 7 |
| **Testing** | Node.js native test runner (`node:test`, `assert/strict`), native `fetch` |
| **Database** | PostgreSQL with B-Tree indexes, partial indexes, and transactional isolation |

---

## Prerequisites

Before setting up DevLog, ensure you have the following installed:
1. **Node.js**: `v20.x` or higher (tested on Node v25).
2. **PostgreSQL**: `v14` or higher running locally on port `5432`.
3. **npm**: `v9.x` or higher.

---

## Step-by-Step Setup Guide

### 1. Database Creation
Create a local PostgreSQL database named `Devlog` using `psql` or pgAdmin:

```sql
CREATE DATABASE "Devlog";
```

### 2. Backend Configuration & Setup

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
   # On Windows (PowerShell)
   Copy-Item .env.example .env

   # On Linux/macOS
   cp .env.example .env
   ```

   Ensure `.env` matches your local PostgreSQL credentials:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/Devlog?schema=public"
   FRONTEND_URL="http://localhost:5173"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
   *This applies the initial schema migration and the partial index on open incidents.*

5. Seed initial starter data:
   ```bash
   npm run seed
   ```
   *Seeds 3 baseline services (`User Auth`, `Billing Engine`, `Notification API`) and 3 incidents (2 OPEN, 1 RESOLVED with a post-mortem).*

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend starts with auto-reload at `http://localhost:4000`.*

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```env
   VITE_API_URL="http://localhost:4000/api/v1"
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Vite starts the React application at `http://localhost:5173/`.*

---

## How to Run Tests

### Backend Automated Test Suite
DevLog includes an end-to-end integration test suite covering health checks, CRUD operations, transactions, race conditions, pagination, filtering, and analytics without third-party test runners:

```bash
cd backend
npm test
```

### Performance & Bulk Data Benchmarks
To test performance with realistic high-volume data:

```bash
cd backend

# Insert 20,000 incidents with post-mortems (~3.8s)
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
│       ├── controllers/       # HTTP request handlers (status codes, response serialization)
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
