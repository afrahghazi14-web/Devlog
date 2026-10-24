# DevLog Syllabus & Curriculum Mapping

This document provides a line-by-line mapping demonstrating how every requirement from the syllabus defined in [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md#L62-L73) is implemented in the real DevLog codebase.

---

## 1. Backend Engineering & REST Architecture

| Syllabus Topic | Description & Implementation Details | Code References in DevLog |
| :--- | :--- | :--- |
| **REST + CRUD + Status Codes** | Complete CRUD endpoints for Services, Incidents, Post-Mortems, and Stats using proper HTTP semantics (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`). | • [backend/src/controllers/service.controller.js](backend/src/controllers/service.controller.js#L5-L14)<br>• [backend/src/controllers/incident.controller.js](backend/src/controllers/incident.controller.js#L5-L39)<br>• [backend/src/controllers/stats.controller.js](backend/src/controllers/stats.controller.js#L5-L13) |
| **Layered Design** | Strict 4-tier separation: `routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `repositories`. Only repositories communicate with the database. | • Routes: [backend/src/routes/](backend/src/routes/)<br>• Controllers: [backend/src/controllers/](backend/src/controllers/)<br>• Services: [backend/src/services/](backend/src/services/)<br>• Repositories: [backend/src/repositories/](backend/src/repositories/) |
| **Middleware** | Custom async handler wrapper catching unhandled rejections; centralized rate limiting; error handling pipeline. | • [backend/src/middleware/asyncHandler.js](backend/src/middleware/asyncHandler.js#L4-L6)<br>• [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js#L4-L35)<br>• [backend/src/app.js](backend/src/app.js#L16-L28) |
| **Input Validation** | Rigorous domain validation for required fields, string lengths, enums, and numerical ranges with clear error messages. | • [backend/src/services/incident.service.js](backend/src/services/incident.service.js#L72-L117)<br>• [backend/src/services/service.service.js](backend/src/services/service.service.js#L11-L30) |
| **Central Error Handling** | Standardized JSON error response envelope `{ error: { message, code, details } }` returning clean status codes without leaking stack traces. | • [backend/src/errors/AppError.js](backend/src/errors/AppError.js#L4-L12)<br>• [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js#L4-L35) |
| **ACID Transactions** | Resolving an incident marks the status `RESOLVED` and inserts the `PostMortem` inside a single atomic database transaction. | • [backend/src/repositories/incident.repository.js](backend/src/repositories/incident.repository.js#L55-L95) |
| **Race-Condition Protection** | Prevents concurrent resolution race conditions using atomic row update condition (`WHERE id = :id AND status = 'OPEN'`) returning 409 Conflict. | • [backend/src/repositories/incident.repository.js](backend/src/repositories/incident.repository.js#L68-L80)<br>• [backend/src/services/incident.service.js](backend/src/services/incident.service.js#L126-L135) |
| **Pagination & Filtering** | Offset-based pagination (`skip`, `take`, `page`, `limit`) with status filtering (`ALL`, `OPEN`, `RESOLVED`) and metadata envelope (`total`, `totalPages`). | • [backend/src/repositories/incident.repository.js](backend/src/repositories/incident.repository.js#L9-L43)<br>• [backend/src/services/incident.service.js](backend/src/services/incident.service.js#L30-L56) |
| **API Versioning** | All endpoints explicitly versioned under `/api/v1` for backward-compatible evolution. | • [backend/src/app.js](backend/src/app.js#L62)<br>• [backend/src/routes/index.js](backend/src/routes/index.js#L1-L15) |
| **API Hardening & Security** | Helmet HTTP headers, IP rate limiting (300 requests/15m), 100kb payload clamping, and CORS origin enforcement. | • [backend/src/app.js](backend/src/app.js#L13-L60) |

---

## 2. Full-Stack Web Development & Modern React

| Syllabus Topic | Description & Implementation Details | Code References in DevLog |
| :--- | :--- | :--- |
| **Git Workflow** | 10 structured phase-by-phase commits following Conventional Commits, clean branch history, and zero committed secrets. | • GitHub Commit History: `master` branch<br>• [docs/PROGRESS.md](docs/PROGRESS.md) |
| **Custom Hooks** | Custom hooks abstracting asynchronous data fetching and mutations (`useStats`, `useServiceStats`, `useIncidents`, `useIncident`, `useServices`, `useCreateIncident`, `useResolveIncident`, `useCreateService`). | • [frontend/src/hooks/useStats.js](frontend/src/hooks/useStats.js#L5-L21)<br>• [frontend/src/hooks/useIncidents.js](frontend/src/hooks/useIncidents.js#L6-L21)<br>• [frontend/src/hooks/useCreateIncident.js](frontend/src/hooks/useCreateIncident.js#L6-L17)<br>• [frontend/src/hooks/useResolveIncident.js](frontend/src/hooks/useResolveIncident.js#L6-L19) |
| **React Hook Form** | Form state management, validation rules (required, min/max length, positive integer ranges), and error message rendering under fields. | • [frontend/src/components/AddIncidentModal.jsx](frontend/src/components/AddIncidentModal.jsx#L10-L165)<br>• [frontend/src/components/ResolveIncidentModal.jsx](frontend/src/components/ResolveIncidentModal.jsx#L10-L185)<br>• [frontend/src/components/RegisterServiceModal.jsx](frontend/src/components/RegisterServiceModal.jsx#L10-L135) |
| **Error Boundaries** | React class component error boundary catching runtime JavaScript rendering errors and displaying user-friendly recovery UI. | • [frontend/src/components/ErrorBoundary.jsx](frontend/src/components/ErrorBoundary.jsx#L5-L51)<br>• [frontend/src/layouts/AppLayout.jsx](frontend/src/layouts/AppLayout.jsx#L58-L62) |
| **Nested Layout Routes** | Persistent top-bar layout with active route styling wrapping page outlets using React Router 7. | • [frontend/src/layouts/AppLayout.jsx](frontend/src/layouts/AppLayout.jsx#L5-L65)<br>• [frontend/src/App.jsx](frontend/src/App.jsx#L24-L30) |
| **Axios Instance & Env Vars** | Central Axios instance configured with `import.meta.env.VITE_API_URL`, timeout, headers, and standardized error response interceptors. | • [frontend/src/api/client.js](frontend/src/api/client.js#L4-L44) |
| **TanStack Query (Queries & Mutations)** | Query caching, query keys incorporating filter arguments, optimistic pagination (`keepPreviousData`), and targeted query invalidations. | • [frontend/src/hooks/useIncidents.js](frontend/src/hooks/useIncidents.js#L6-L12)<br>• [frontend/src/hooks/useCreateIncident.js](frontend/src/hooks/useCreateIncident.js#L11-L15)<br>• [frontend/src/hooks/useResolveIncident.js](frontend/src/hooks/useResolveIncident.js#L11-L17) |
| **API Error Handling in UI** | Server error responses (such as 409 Conflict) displayed inside modal banners without dismissing dialogs; retry buttons on network failure. | • [frontend/src/components/ResolveIncidentModal.jsx](frontend/src/components/ResolveIncidentModal.jsx#L71-L89)<br>• [frontend/src/components/ErrorMessage.jsx](frontend/src/components/ErrorMessage.jsx#L4-L24) |
| **Relational Data in UI** | Incidents render joined Service names and Environment badges; PostMortem modal displays associated service and incident details. | • [frontend/src/pages/DashboardPage.jsx](frontend/src/pages/DashboardPage.jsx#L254-L265)<br>• [frontend/src/components/PostMortemModal.jsx](frontend/src/components/PostMortemModal.jsx#L76-L86) |
| **Data Freshness** | Automatic background polling (every 30 seconds) and refetch on window focus for stats cards and incident listings. | • [frontend/src/hooks/useStats.js](frontend/src/hooks/useStats.js#L9-L10)<br>• [frontend/src/hooks/useIncidents.js](frontend/src/hooks/useIncidents.js#L11-L12) |
| **Modal Accessibility** | Focus management moving focus into modal on open and restoring previous focus on close; Escape key and backdrop click listeners. | • [frontend/src/components/Modal.jsx](frontend/src/components/Modal.jsx#L19-L56) |

---

## 3. Advanced DBMS (PostgreSQL & Prisma ORM)

| Syllabus Topic | Description & Implementation Details | Code References in DevLog |
| :--- | :--- | :--- |
| **ER Modeling & Normalization** | Relational schema in 3NF with enums (`Environment`, `Severity`, `Status`), 1:N Service-Incident relation, and 1:1 Incident-PostMortem relation. | • [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L9-L60) |
| **Constraints & Indexes** | Composite unique constraint on `(name, environment)`, foreign keys with referential integrity, compound index on `(status, createdAt)`, and index on `serviceId`. | • [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L34)<br>• [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L48-L49) |
| **Partial B-Tree Indexes** | Partial index on open incidents (`WHERE status = 'OPEN'`) reducing query time by 35x and index footprint from 632 kB to 40 kB. | • [backend/prisma/migrations/20261024054943_add_partial_open_incident_index/migration.sql](backend/prisma/migrations/20261024054943_add_partial_open_incident_index/migration.sql#L1-L3) |
| **CTEs & Window Functions** | Analytics query using `WITH service_metrics AS (...)` and `RANK() OVER (ORDER BY "totalMinutesSpent" DESC)` with BigInt-safe integer casting. | • [backend/src/repositories/stats.repository.js](backend/src/repositories/stats.repository.js#L43-L80) |
| **Transactions & Isolation** | PostgreSQL Read Committed isolation, Multi-Version Concurrency Control (MVCC), and atomic `updateMany` row-level lock guard. | • [docs/PERFORMANCE.md](docs/PERFORMANCE.md#4-advanced-database-architecture--concurrency)<br>• [backend/src/repositories/incident.repository.js](backend/src/repositories/incident.repository.js#L55-L95) |
| **EXPLAIN ANALYZE Evidence** | Empirical query planner execution plans for Query A and Query B comparing Sequential Scans vs. Index Scans with 20,000 synthetic rows. | • [docs/PERFORMANCE.md](docs/PERFORMANCE.md#2-explain-analyze-evidence) |
| **Prisma Migrations** | Full migration history with custom migration generation via `prisma migrate dev --create-only`. | • [backend/prisma/migrations/](backend/prisma/migrations/) |
| **N+1 Query Elimination** | Prisma `include: { service: true }` executes relation lookups in constant O(1) database roundtrips instead of looping. | • [backend/src/repositories/incident.repository.js](backend/src/repositories/incident.repository.js#L20-L24) |
| **Prisma Driver Adapters** | Prisma 7 driver adapter `@prisma/adapter-pg` utilizing PostgreSQL connection pooling. | • [backend/src/config/db.js](backend/src/config/db.js#L1-L15)<br>• [backend/prisma.config.js](backend/prisma.config.js#L1-L10) |
| **Connection Pooling** | Single shared `PrismaClient` preventing PostgreSQL connection starvation (`max_connections` exhaustion). | • [backend/src/config/db.js](backend/src/config/db.js#L1-L15)<br>• [docs/PERFORMANCE.md](docs/PERFORMANCE.md#c-connection-pooling--shared-prismaclient) |
| **High-Throughput Bulk Seeding** | 20,000-record batch insertion using `createManyAndReturn` completing in ~3.8 seconds. | • [backend/prisma/seed-bulk.js](backend/prisma/seed-bulk.js#L1-L135) |
