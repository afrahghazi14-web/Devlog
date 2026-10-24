# DevLog: Pre-Submission Verification Checklist

This document serves as the final quality assurance and verification audit for the DevLog academic submission. Every item has been empirically checked against the working codebase.

---

## 1. Project Constraints & Architectural Integrity

- [x] **Plain JavaScript Only**: All source code strictly uses JavaScript (`.js` and `.jsx`). Zero TypeScript files (`.ts` or `.tsx`) exist in the repository.
- [x] **PostgreSQL Exclusivity**: All persistence uses PostgreSQL via Prisma ORM and `@prisma/adapter-pg`. Zero MongoDB or NoSQL dependencies.
- [x] **Strict 4-Layer Backend Architecture**:
  - `routes/`: Express routers mapping URLs to controllers.
  - `controllers/`: Request extraction, status codes, JSON responses. Zero database queries.
  - `services/`: Business validation and orchestration. Zero HTTP logic.
  - `repositories/`: The ONLY layer importing `PrismaClient` and executing database queries.
- [x] **Git Cleanliness**: All phases 0 through 10 have been incrementally committed following Conventional Commits and pushed to [GitHub](https://github.com/afrahghazi14-web/Devlog.git).
- [x] **Zero Secrets in Git**: `.env` is ignored in `.gitignore`; only `.env.example` is committed.

---

## 2. Five Mandatory Spot-Checked Claims

To guarantee that all documentation matches the living codebase, the following 5 critical claims have been verified against active code:

### Spot-Check 1: Partial B-Tree Index Migration SQL
- **Claim**: DevLog defines a custom partial index on open incidents sorted descending by `createdAt`:
  `CREATE INDEX "Incident_open_createdAt_idx" ON "Incident" ("createdAt" DESC) WHERE status = 'OPEN';`
- **Verified in Code**:
  - File: [backend/prisma/migrations/20261024054943_add_partial_open_incident_index/migration.sql](file:///c:/dev/Devlog/backend/prisma/migrations/20261024054943_add_partial_open_incident_index/migration.sql#L1-L3)
  - Database System Catalog verification:
    ```sql
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Incident';
    ```
    Output: `CREATE INDEX "Incident_open_createdAt_idx" ON public."Incident" USING btree ("createdAt" DESC) WHERE (status = 'OPEN'::"Status")`
- **Status**: **VERIFIED**

---

### Spot-Check 2: Atomic Race-Condition Guard for Incident Resolution
- **Claim**: To prevent race conditions during concurrent resolutions, the repository executes an atomic update query with a status predicate (`WHERE id = :id AND status = 'OPEN'`) inside a database transaction, throwing a 409 Conflict if `count === 0`.
- **Verified in Code**:
  - File: [backend/src/repositories/incident.repository.js](file:///c:/dev/Devlog/backend/src/repositories/incident.repository.js#L68-L82)
    ```javascript
    const updateResult = await tx.incident.updateMany({
      where: {
        id: incidentId,
        status: 'OPEN',
      },
      data: {
        status: 'RESOLVED',
      },
    });

    if (updateResult.count === 0) {
      const existing = await tx.incident.findUnique({ where: { id: incidentId } });
      if (!existing) throw new AppError('Incident not found', 404);
      throw new AppError('Incident is already resolved', 409);
    }
    ```
- **Status**: **VERIFIED**

---

### Spot-Check 3: Service Ranking with Common Table Expression (CTE) & Window Function
- **Claim**: `GET /api/v1/stats/services` executes a raw SQL query using `WITH service_metrics AS (...)` and `RANK() OVER (ORDER BY "totalMinutesSpent" DESC)` with BigInt-safe integer casting.
- **Verified in Code**:
  - File: [backend/src/repositories/stats.repository.js](file:///c:/dev/Devlog/backend/src/repositories/stats.repository.js#L43-L78)
    ```javascript
    const rows = await prisma.$queryRaw`
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
    `;
    ```
- **Status**: **VERIFIED**

---

### Spot-Check 4: React Error Boundary Implementation
- **Claim**: The frontend incorporates a React Error Boundary class component that catches uncaught runtime rendering errors and renders a dark-mode fallback UI with a recovery button.
- **Verified in Code**:
  - Component: [frontend/src/components/ErrorBoundary.jsx](file:///c:/dev/Devlog/frontend/src/components/ErrorBoundary.jsx#L4-L49)
  - Integration: [frontend/src/layouts/AppLayout.jsx](file:///c:/dev/Devlog/frontend/src/layouts/AppLayout.jsx#L58-L62)
    ```jsx
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </main>
    ```
- **Status**: **VERIFIED**

---

### Spot-Check 5: Centralized Payload Clamping & API Hardening
- **Claim**: The Express server enforces a 100kb payload size limit, rate limiting of 300 requests per 15 minutes, Helmet security headers, and standard CORS protection.
- **Verified in Code**:
  - File: [backend/src/app.js](file:///c:/dev/Devlog/backend/src/app.js#L14-L44)
    ```javascript
    app.use(helmet());
    app.use(express.json({ limit: '100kb' }));
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
    ```
- **Status**: **VERIFIED**

---

## 3. Full-Stack Verification & Test Results

| Verification Area | Requirement | Result |
| :--- | :--- | :--- |
| **Backend Test Suite** | All automated integration tests run and pass without failures (`npm test`) | **13 / 13 PASS** |
| **Idempotent Seed Script** | `npm run seed:reset` runs repeatedly without unique constraint or FK errors | **PASS** |
| **Bulk Seeding Script** | `npm run seed:bulk` generates ~20,000 incidents with post-mortems for benchmarking | **PASS** |
| **Frontend Dev Server** | Vite starts without errors or warnings on `http://localhost:5173` | **PASS** |
| **Backend Dev Server** | Express starts on `http://localhost:4000` with active database connection | **PASS** |
| **Modal Accessibility** | Traps focus, handles `Escape` key, closes on backdrop click, restores trigger focus | **PASS** |
| **TanStack Invalidation** | Mutations immediately refresh incident listings and metric cards without page reload | **PASS** |
| **409 Conflict Display** | Concurrent resolution returns 409 and displays inline alert without modal dismissal | **PASS** |

---

## 4. Required Academic Artifacts Inventory

- [x] `REPORT.md`: Comprehensive 8-section technical report, 3NF schema, ER diagram, performance engineering, and architecture.
- [x] `SYLLABUS_MAPPING.md`: Complete line-by-line mapping of all 25 syllabus competencies to concrete code files.
- [x] `VIVA_PREP.md`: 14 detailed viva defense questions & answers covering architecture, PostgreSQL MVCC, partial indexes, and concurrency.
- [x] `DEMO_SCRIPT.md`: Precise 5-minute timed live demonstration script with spoken talking points and two-tab race-condition demo.
- [x] `SUBMISSION_CHECKLIST.md`: This comprehensive audit document with 5 spot-checked claims verified against active source code.
- [x] `docs/API.md`: Comprehensive REST API documentation for all endpoints, schemas, error formats, and curl examples.
- [x] `docs/PERFORMANCE.md`: Empirical 20,000-row benchmark data with raw EXPLAIN ANALYZE output.
- [x] `docs/PROGRESS.md`: Complete audit trail of all phases (0 through 10).
- [x] `README.md`: Fresh-machine setup guide, architecture overview, and running instructions.
