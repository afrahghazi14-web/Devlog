# DevLog: Comprehensive Viva Prep & Examiner Q&A Guide

This guide prepares you to answer any theoretical, architectural, or implementation question about DevLog during a university viva, lab examination, or technical project defense.

---

## Table of Contents
1. [Core Architectural Design & Layering](#1-core-architectural-design--layering)
2. [Database Design, Relational Modeling & 3NF](#2-database-design-relational-modeling--3nf)
3. [Database Performance, Partial B-Tree Indexes & EXPLAIN ANALYZE](#3-database-performance-partial-b-tree-indexes--explain-analyze)
4. [Advanced SQL: CTEs & Window Functions](#4-advanced-sql-ctes--window-functions)
5. [Transactions, Isolation & Concurrency Control](#5-transactions-isolation--concurrency-control)
6. [Frontend State Management & Modern React](#6-frontend-state-management--modern-react)
7. [Security, Hardening & Centralized Error Pipeline](#7-security-hardening--centralized-error-pipeline)
8. [Automated Testing & Reliability](#8-automated-testing--reliability)

---

## 1. Core Architectural Design & Layering

### Q1: Why did you choose a 4-layer architecture instead of putting database queries in route handlers?
**Answer:**
A monolithic route handler mixes HTTP routing, request parsing, business validation, and database queries in one place. This makes code hard to test, hard to maintain, and prone to duplication. 

In DevLog, we enforce a strict 4-tier separation:
1. **Routes (`routes/*.routes.js`)**: Pure routing. Maps HTTP verbs (`GET`, `POST`) and URLs to controller handlers.
2. **Controllers (`controllers/*.controller.js`)**: Pure HTTP translation. Extracts `req.body`, `req.params`, and `req.query`, passes clean data to the service layer, and writes JSON responses with status codes (`200`, `201`, `400`, `404`, `409`). Controllers contain zero database queries.
3. **Services (`services/*.service.js`)**: Pure business logic. Enforces business rules (e.g. verifying that a referenced service exists before logging an incident; checking that an incident is OPEN before resolving). Services have no knowledge of `req` or `res`.
4. **Repositories (`repositories/*.repository.js`)**: Pure data access. This is the **only layer** that imports `PrismaClient` and interacts with PostgreSQL. If we ever swap Prisma or PostgreSQL for another data layer, only repositories change.

### Q2: Trace a request from the browser to PostgreSQL and back when resolving an incident.
**Answer:**
1. **HTTP Request**: The browser sends `PATCH /api/v1/incidents/2/resolve` with a JSON payload `{ rootCause, resolutionSteps, timeSpentMinutes: 90 }`.
2. **Middleware Pipeline**: Express parses the JSON (`express.json({ limit: '100kb' })`), Helmet sets security headers, and the CORS middleware verifies the origin.
3. **Routes Layer**: `incident.routes.js` routes `PATCH /:id/resolve` to `incidentController.resolveIncident`.
4. **Controller Layer**: `incident.controller.js` parses `req.params.id` as an integer and extracts the body, delegating to `incidentService.resolveIncident(id, payload)`.
5. **Service Layer**: `incident.service.js` validates that `rootCause`, `resolutionSteps`, and `timeSpentMinutes` are valid and non-empty.
6. **Repository Layer**: `incident.repository.js` executes `prisma.$transaction`. Inside the transaction:
   - An atomic `prisma.incident.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'RESOLVED' } })` is executed.
   - If `count === 0`, it verifies whether the incident exists. If it exists but is already `RESOLVED`, it throws a `409 Conflict`.
   - Next, it creates the `PostMortem` record linked to the incident ID.
7. **Return**: The newly resolved incident with its post-mortem is returned up the stack. The controller returns HTTP `200 OK` with `{ status: 'success', data: { incident } }`.

---

## 2. Database Design, Relational Modeling & 3NF

### Q3: What Normal Form is your database schema in? Prove it.
**Answer:**
Our database is strictly in **Third Normal Form (3NF)**:
- **First Normal Form (1NF)**: Every table has a primary key (`id SERIAL`), all attributes contain atomic (indivisible) scalar values, and there are no repeating groups or multi-valued arrays.
- **Second Normal Form (2NF)**: It is in 1NF, and all non-key attributes are fully functionally dependent on the entire primary key. In `Service`, `name` and `environment` depend on `id`. In `Incident`, `title`, `description`, `severity`, and `status` depend on `id`. There are no partial dependencies.
- **Third Normal Form (3NF)**: It is in 2NF, and there are **no transitive dependencies** (no non-key attribute depends on another non-key attribute). For example, `Incident` only stores `serviceId`. It does not store `serviceName` or `serviceEnvironment`. To get service information, we perform a relational `JOIN`.

### Q4: Explain the relationships, foreign keys, and cascade behaviors.
**Answer:**
- **Service $\rightarrow$ Incident (1-to-Many / 1:N)**: One service can experience zero, one, or many incidents.
  - Foreign Key: `Incident.serviceId` references `Service.id`.
  - Referential Action: `ON DELETE RESTRICT ON UPDATE CASCADE`. We disallow deleting a service if incidents are attached to it to prevent orphaned historical operational records.
- **Incident $\rightarrow$ PostMortem (1-to-1 / 1:1)**: An incident has at most one post-mortem, and every post-mortem belongs to exactly one incident.
  - Foreign Key: `PostMortem.incidentId` references `Incident.id`.
  - Constraint: `incidentId` has a `UNIQUE` constraint, enforcing that an incident cannot have multiple post-mortems.
  - Referential Action: `ON DELETE CASCADE ON UPDATE CASCADE`. If an incident is deleted, its post-mortem is cleaned up automatically.
- **Composite Unique Constraint**: `@@unique([name, environment])` on `Service`. This allows a service named "User Auth" in `STAGING` and another "User Auth" in `PRODUCTION`, but forbids two "User Auth" services in `PRODUCTION`.

---

## 3. Database Performance, Partial B-Tree Indexes & EXPLAIN ANALYZE

### Q5: What is a B-Tree index, and what is a Partial Index?
**Answer:**
A **B-Tree (Balanced Tree)** is a self-balancing tree data structure that keeps data sorted and allows searches, sequential access, insertions, and deletions in logarithmic time ($O(\log N)$).

A **Partial Index** is an index built over a subset of rows in a table defined by a conditional `WHERE` clause. 
In DevLog:
```sql
CREATE INDEX "Incident_open_createdAt_idx" 
ON "Incident" ("createdAt" DESC) 
WHERE status = 'OPEN';
```
In real production systems, ~95% of incidents are resolved, and only ~5% remain open. An operations dashboard almost exclusively queries **open** incidents. By adding `WHERE status = 'OPEN'`:
1. The index only stores rows where `status = 'OPEN'`.
2. It completely excludes the 95% resolved rows.
3. This saves massive RAM and disk space, and makes index writes on resolved incidents faster because the partial index does not need to be updated.

### Q6: What was the empirical performance difference when tested with 20,000 rows?
**Answer:**
Using `EXPLAIN (ANALYZE, BUFFERS)` on Query A (`SELECT * FROM "Incident" WHERE status = 'OPEN' ORDER BY "createdAt" DESC LIMIT 10`):
- **Without Partial Index**:
  - The query planner had to do a **Parallel Sequential Scan** across all 20,000 table pages, filtering out resolved rows, followed by a memory-heavy **Top-N Sort**.
  - Execution Time: **~14.54 ms**.
- **With Partial Index**:
  - The query planner executed a **Bitmap Index Scan** directly on `Incident_open_createdAt_idx`, immediately fetching only the matching open rows.
  - Execution Time: **~0.41 ms**.
- **Result**: A **35x speedup** (3500% throughput gain).
- **Disk Storage**: The partial index takes only **40 kB**, compared to **632 kB** for a full table compound index (a **93.7% storage saving**).

---

## 4. Advanced SQL: CTEs & Window Functions

### Q7: Explain the Service Analytics query. What is a Common Table Expression (CTE) and a Window Function?
**Answer:**
Our service ranking analytics endpoint (`GET /api/v1/stats/services`) runs the following SQL:
```sql
WITH service_metrics AS (
  SELECT 
    s.id,
    s.name,
    s.environment,
    COUNT(i.id)::int AS "totalIncidents",
    COUNT(CASE WHEN i.status = 'OPEN' THEN 1 END)::int AS "openIncidents",
    COALESCE(SUM(pm."timeSpentMinutes"), 0)::int AS "totalMinutesSpent"
  FROM "Service" s
  LEFT JOIN "Incident" i ON s.id = i."serviceId"
  LEFT JOIN "PostMortem" pm ON i.id = pm."incidentId"
  GROUP BY s.id, s.name, s.environment
)
SELECT 
  id,
  name,
  environment,
  "totalIncidents",
  "openIncidents",
  "totalMinutesSpent",
  RANK() OVER (ORDER BY "totalMinutesSpent" DESC)::int AS rank
FROM service_metrics
ORDER BY rank ASC, name ASC;
```

- **Common Table Expression (CTE)**: Defined using the `WITH` clause. It creates a temporary named result set (`service_metrics`) that exists only for the duration of the query. It allows modular, readable query design instead of messy nested subqueries.
- **Window Function (`RANK() OVER (...)`)**: Unlike an aggregate function (which collapses rows into a single summary), a window function calculates an aggregate or rank over a specific "window" of rows while retaining the individual identity of each row.
- **Difference from `DENSE_RANK()` or `ROW_NUMBER()`**:
  - `ROW_NUMBER()` assigns strictly unique sequential integers (1, 2, 3) even if values tie.
  - `RANK()` assigns identical ranks to ties (e.g. 1, 2, 2, 4), leaving a gap.
  - `DENSE_RANK()` assigns identical ranks to ties without gaps (1, 2, 2, 3). In DevLog, `RANK()` accurately reflects competition standing.
- **BigInt Casting**: PostgreSQL `COUNT()` and `SUM()` return 64-bit BigInts. Because JavaScript `JSON.stringify` throws a `TypeError` on native BigInts, we explicitly cast aggregates in SQL using `::int` and wrap with `Number()` in the repository layer.

---

## 5. Transactions, Isolation & Concurrency Control

### Q8: What are ACID properties, and how are they achieved when resolving an incident?
**Answer:**
- **Atomicity (All or Nothing)**: Resolving an incident requires two operations: updating the incident status to `RESOLVED` and creating the `PostMortem` record. We wrap both in `prisma.$transaction([ ... ])`. If inserting the post-mortem fails (e.g. constraint violation), the status update is completely rolled back.
- **Consistency**: The database transitions from one valid state to another. Foreign key integrity (`incidentId` references `Incident.id`) and unique constraints (`PostMortem.incidentId` is unique) are strictly preserved.
- **Isolation**: PostgreSQL uses **Read Committed** isolation level by default with Multi-Version Concurrency Control (MVCC). A concurrent query will never see a half-updated state where the incident is `RESOLVED` but the `PostMortem` does not exist yet.
- **Durability**: Once the transaction commits, PostgreSQL writes changes to the Write-Ahead Log (WAL) on non-volatile storage, guaranteeing the data survives server crashes.

### Q9: How does DevLog prevent a race condition when two engineers resolve the same incident simultaneously?
**Answer:**
If Engineer A and Engineer B have the same open incident open in two different browser tabs and both click "Resolve", a naive implementation (`if (incident.status === 'RESOLVED') throw Error`) suffers from a **Time-of-Check to Time-of-Use (TOCTOU)** race condition.

In DevLog:
1. We execute an atomic update query at the database level:
   ```javascript
   const updateResult = await tx.incident.updateMany({
     where: { id: incidentId, status: 'OPEN' },
     data: { status: 'RESOLVED' }
   });
   ```
2. In PostgreSQL, row-level locks are acquired during update execution.
3. The first request updates the row and gets `updateResult.count === 1`. It proceeds to insert the post-mortem.
4. The second request reaches the row immediately after, but the row's status is already `RESOLVED`. Thus `where: { status: 'OPEN' }` matches 0 rows, and `updateResult.count === 0`.
5. The repository detects `count === 0`, checks if the incident exists, and throws an `AppError('Incident is already resolved', 409)`.
6. The second engineer sees a clear red banner: *"409 Conflict: This incident has already been resolved by another engineer"* without corrupting data or creating duplicate post-mortems.

---

## 6. Frontend State Management & Modern React

### Q10: Why did you use TanStack Query (React Query) instead of plain `useEffect` + `useState`?
**Answer:**
Plain `useEffect` fetching requires manually writing boilerplate for loading states, error states, race conditions, request cancellation, caching, and re-fetching on focus.

TanStack Query provides:
1. **Intelligent Caching**: Automatically caches responses in memory.
2. **Dynamic Query Keys**: We include filter parameters in the query key:
   `queryKey: ['incidents', { status, page, limit }]`. 
   When the user switches tabs (All $\rightarrow$ Open $\rightarrow$ Resolved), TanStack Query caches each tab separately, giving instantaneous navigation without reloading.
3. **Automated Cache Invalidation**: When a mutation succeeds (e.g. creating an incident or resolving one), we call `queryClient.invalidateQueries({ queryKey: ['incidents'] })` and `queryClient.invalidateQueries({ queryKey: ['stats'] })`. This guarantees the dashboard cards and incident table update instantly.
4. **Data Freshness**: Configured with `refetchInterval: 30000` (polling every 30 seconds) and `refetchOnWindowFocus: true` so multiple engineers viewing the dashboard always see real-time updates.

### Q11: How is modal accessibility handled in plain JavaScript?
**Answer:**
In `frontend/src/components/Modal.jsx`:
1. **Focus Trap / Initial Focus**: When the modal opens, a `useEffect` finds the first focusable element (`input`, `button`, `textarea`) and moves keyboard focus into it so screen-reader and keyboard users can immediately type.
2. **Focus Restoration**: Before opening, it captures `document.activeElement`. When the modal closes, it restores focus to the button that originally triggered it.
3. **Escape Key Handling**: A `keydown` listener on `window` listens for `Escape` and invokes `onClose()`.
4. **Backdrop Click**: Clicking the darkened background overlay triggers `onClose()`, while clicking inside the modal content stops event propagation (`e.stopPropagation()`).
5. **ARIA Attributes**: The dialog has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"`.

---

## 7. Security, Hardening & Centralized Error Pipeline

### Q12: What security measures did you implement in the backend?
**Answer:**
1. **Helmet Middleware (`helmet()`)**: Sets 15+ secure HTTP headers (including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security`) to mitigate Cross-Site Scripting (XSS) and clickjacking.
2. **Rate Limiting (`express-rate-limit`)**: Enforces a strict ceiling of **300 requests per 15-minute window** per IP address to protect against Denial of Service (DoS) and brute-force attacks.
3. **Payload Clamping**: `express.json({ limit: '100kb' })` prevents memory exhaustion attacks from maliciously large HTTP request bodies.
4. **CORS Restrictions**: Whitelists only approved development and production frontend origins (`http://localhost:5173`, etc.) with `credentials: true`.
5. **Centralized Error Envelope**: An `AppError` class ensures no stack traces, SQL syntax, or internal file paths leak to the client in production responses. All errors adhere to `{ error: { message, code, details } }`.

---

## 8. Automated Testing & Reliability

### Q13: How does your test suite work without installing external frameworks like Jest or Mocha?
**Answer:**
We use Node.js's built-in test runner: `node:test` and `node:assert/strict`, introduced in Node 18+.
- **Zero Third-Party Dependencies**: No Jest, Mocha, or Chai bloat. Runs natively using `node --test tests/api.test.js`.
- **Real HTTP Fetching**: Tests make real HTTP network calls using global `fetch()` against the running Express application on port 4000.
- **Coverage**: 13 automated integration tests cover:
  1. Health check (`GET /api/v1/health`)
  2. Service listing and pagination
  3. Service creation validation (missing fields, duplicate service conflict)
  4. Incident creation validation (invalid service ID, missing title)
  5. Incident listing with status filters and pagination metadata
  6. Atomic incident resolution and post-mortem creation
  7. Race condition / conflict test (resolving an already resolved incident returns 409)
  8. Dashboard summary metrics calculations
  9. Service analytics ranking with CTE + `RANK()`
  10. 404 handler for undefined endpoints

### Q14: How is database seeding made safe and repeatable?
**Answer:**
Our seed script (`backend/prisma/seed.js`) is fully idempotent:
1. It deletes existing data in reverse foreign key order:
   `PostMortem` $\rightarrow$ `Incident` $\rightarrow$ `Service`.
2. It uses `upsert` or fresh sequential inserts with deterministic IDs.
3. Running `npm run seed` or `npm run seed:reset` multiple times will never crash, violate unique constraints, or leave duplicate orphaned records.
