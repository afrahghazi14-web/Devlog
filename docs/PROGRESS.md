# Progress log

Phase 0 complete

## Phase 1: Backend skeleton, schema, migration

### What was built
- **Backend Node.js Project Setup**:
  - Initialized `backend/package.json` configured with `"type": "module"` for ES Modules.
  - Installed dependencies: `express`, `cors`, `dotenv`, `@prisma/client`, `@prisma/adapter-pg`, `pg`.
  - Installed dev dependencies: `prisma`, `nodemon`.
  - Added npm scripts: `"dev": "nodemon src/server.js"` and `"start": "node src/server.js"`.
- **Prisma 7 Extra Setup**:
  - Prisma 7 splits database connection settings and migrations from `schema.prisma` into a configuration file. Added `backend/prisma.config.js` (written in plain JavaScript to adhere to the no-TypeScript rule) to define `schema`, `migrations.path`, and `datasource.url`.
  - Prisma 7 requires driver adapters to instantiate `PrismaClient`. Installed `@prisma/adapter-pg` and `pg`, configuring a single shared `PrismaClient` with `PrismaPg({ connectionString: env.DATABASE_URL })`.
- **Layered Backend Architecture**:
  - `src/config/env.js`: Central environment variable loader using `dotenv`.
  - `src/config/db.js`: Instantiates and exports a single shared `PrismaClient` using `@prisma/adapter-pg`.
  - `src/repositories/health.repository.js`: Database layer executing a trivial query (`SELECT 1;`) to verify PostgreSQL connectivity.
  - `src/services/health.service.js`: Service layer executing business checks for system health.
  - `src/controllers/health.controller.js`: Controller layer responding with HTTP 200 `{ "status": "ok", "database": "up" }` on success, or HTTP 503 `{ "status": "error", "database": "down" }` if the database query fails.
  - `src/routes/health.routes.js` & `src/routes/index.js`: Express router mounting `/health` under `/api/v1`.
  - `src/middleware/errorHandler.js`: Central error-handling middleware returning consistent JSON errors: `{ "error": { "message": "...", "code": "..." } }`.
  - `src/app.js`: Express app configuring CORS, JSON body parsing, `/api/v1` routes, and central error handling.
  - `src/server.js`: Server entry point listening on `env.PORT`.
- **Environment Configuration**:
  - Created `backend/.env` containing `PORT=4000` and `DATABASE_URL` pointing to PostgreSQL database `Devlog` (`postgresql://postgres:***@localhost:5432/Devlog?schema=public`).
  - Created `backend/.env.example` with placeholder credentials.
  - Verified `backend/.env` is git-ignored.
- **Database Schema & Migration**:
  - Created `backend/prisma/schema.prisma` with enums (`Environment`, `Severity`, `Status`) and models (`Service`, `Incident`, `PostMortem`) matching the project specification.
  - Ran `npx prisma migrate dev --name init` which successfully created all tables, indexes, and foreign keys in the `Devlog` PostgreSQL database.

### Files Added or Changed
- `backend/package.json`: Project manifest with ES modules and scripts.
- `backend/package-lock.json`: Dependency lockfile.
- `backend/.gitignore`: Ignores `node_modules` and `.env`.
- `backend/.env`: Local environment configuration (git-ignored).
- `backend/.env.example`: Example environment template.
- `backend/prisma.config.js`: Prisma 7 configuration file for schema, migrations, and datasource URL.
- `backend/prisma/schema.prisma`: Prisma data models and enums.
- `backend/prisma/migrations/20261023095826_init/migration.sql`: Initial migration creating tables and constraints.
- `backend/src/config/env.js`: Loads environment variables.
- `backend/src/config/db.js`: Single shared Prisma client with driver adapter.
- `backend/src/repositories/health.repository.js`: Database connectivity check query.
- `backend/src/services/health.service.js`: Health service logic.
- `backend/src/controllers/health.controller.js`: HTTP controller for GET /api/v1/health.
- `backend/src/routes/health.routes.js`: Health route mapping.
- `backend/src/routes/index.js`: API v1 router aggregator.
- `backend/src/middleware/errorHandler.js`: Central JSON error response handler.
- `backend/src/app.js`: Express application setup.
- `backend/src/server.js`: HTTP server startup script.
- `docs/PROGRESS.md`: Updated with Phase 1 documentation.

### How to Run and Test
1. **Start the server**:
   - In development mode (auto-reload with nodemon):
     ```bash
     cd backend
     npm run dev
     ```
   - In standard mode:
     ```bash
     cd backend
     npm start
     ```
2. **Verify Health Endpoint**:
   - Run:
     ```bash
     curl -i http://localhost:4000/api/v1/health
     ```
   - Expected Output:
     ```json
     HTTP/1.1 200 OK
     Content-Type: application/json; charset=utf-8

     {"status":"ok","database":"up"}
     ```
   - If the database is unreachable, the endpoint returns HTTP 503 with:
     ```json
     {"status":"error","database":"down"}
     ```

### Anything You Need to Know
- The PostgreSQL database name is case-sensitive and must be written as `Devlog` (capital `D`) in `DATABASE_URL`.
- Prisma version 7 requires `@prisma/adapter-pg` driver adapter for runtime queries and `prisma.config.js` for migration/CLI operations.

## Phase 2: Service and incident APIs (read + create)

### What was built
- **Layered Architecture Implementation**:
  - Implemented strict separation of concerns across routes -> controllers -> services -> repositories.
  - Ensured only repository files import Prisma and access the database.
- **Service Endpoints**:
  - `GET /api/v1/services`: Lists all registered services, ordered alphabetically by name (`orderBy: { name: 'asc' }`).
  - `POST /api/v1/services`: Registers a new service with `name` and `environment` (`PRODUCTION`, `STAGING`, `QA`). Validates input, prevents duplicate `(name, environment)` with HTTP 409 Conflict, and returns HTTP 201 with the created service.
- **Incident Endpoints**:
  - `GET /api/v1/incidents`: Fetches paginated incidents with query params `status` (`ALL`, `OPEN`, `RESOLVED`, default `ALL`), `page` (integer >= 1, default 1), and `limit` (integer 1..50, default 10).
    - Sorts newest first (`createdAt: 'desc'`).
    - Uses offset pagination (`skip`, `take`).
    - Solves the N+1 problem by including the related service in the query (`include: { service: true }`).
    - Fetches the paginated records and the total count atomically using `prisma.$transaction`.
    - Returns standardized pagination envelope: `{ "data": [...], "page": 1, "limit": 10, "total": 3, "totalPages": 1 }`.
  - `GET /api/v1/incidents/:id`: Retrieves a single incident by integer ID, including its associated `service` and `postMortem`. Returns HTTP 404 with a structured error if the incident does not exist.
  - `POST /api/v1/incidents`: Logs a new incident with `serviceId`, `title`, `description`, and `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
    - Enforces the business rule that the referenced service must exist in the **service layer** (returning HTTP 404 if not found).
    - Automatically sets initial status to `OPEN`.
    - Returns HTTP 201 and the newly created incident with its associated service.
- **API Hardening and Error Handling**:
  - Enhanced central error handler to catch malformed JSON payloads (HTTP 400 `BAD_REQUEST`) and Prisma constraint fallbacks.
  - Validated parameter and body types across services to guarantee the server never crashes on invalid or unexpected client input.

### Files Added or Changed
- `backend/src/repositories/service.repository.js`: Database queries for services (`findAll`, `findById`, `findByNameAndEnvironment`, `create`) using Prisma.
- `backend/src/repositories/incident.repository.js`: Database queries and atomic transactions for incidents (`findManyWithCount`, `findById`, `create`) using Prisma.
- `backend/src/services/service.service.js`: Business logic and uniqueness checks for services.
- `backend/src/services/incident.service.js`: Business logic, offset pagination calculation, and service existence validation for incidents.
- `backend/src/controllers/service.controller.js`: HTTP request/response handler for service endpoints.
- `backend/src/controllers/incident.controller.js`: HTTP request/response handler for incident endpoints.
- `backend/src/routes/service.routes.js`: Maps `/services` endpoints to service controller methods.
- `backend/src/routes/incident.routes.js`: Maps `/incidents` endpoints to incident controller methods.
- `backend/src/routes/index.js`: Mounted `/services` and `/incidents` under the `/api/v1` router.
- `backend/src/middleware/errorHandler.js`: Added graceful handling for malformed JSON and Prisma error fallback codes.
- `docs/PROGRESS.md`: Documented Phase 2 deliverables, tests, and architecture notes.

### How to Run and Test
1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Test Service Endpoints**:
   - List services:
     ```bash
     curl -i http://localhost:4000/api/v1/services
     ```
   - Create a service:
     ```bash
     curl -i -X POST http://localhost:4000/api/v1/services \
       -H "Content-Type: application/json" \
       -d "{\"name\":\"Auth Service\",\"environment\":\"PRODUCTION\"}"
     ```
3. **Test Incident Endpoints**:
   - List incidents with pagination and filtering:
     ```bash
     curl -i "http://localhost:4000/api/v1/incidents?status=ALL&page=1&limit=10"
     ```
   - Create an incident:
     ```bash
     curl -i -X POST http://localhost:4000/api/v1/incidents \
       -H "Content-Type: application/json" \
       -d "{\"serviceId\":1,\"title\":\"JWT signature failure\",\"description\":\"Users unable to log in.\",\"severity\":\"CRITICAL\"}"
     ```
   - Fetch incident by ID:
     ```bash
     curl -i http://localhost:4000/api/v1/incidents/1
     ```
   - Fetch non-existent incident (returns 404):
     ```bash
     curl -i http://localhost:4000/api/v1/incidents/9999
     ```

### Anything You Need to Know
- Offset pagination computes `skip = (page - 1) * limit` and `totalPages = Math.ceil(total / limit)`.
- Including the `service` relation in incident queries resolves relations at the ORM/SQL level, preventing N+1 SELECT queries.
- The service existence check for incident creation is enforced in `incident.service.js` before calling the repository layer.

## Phase 3: Resolve workflow, stats, validation, error handling, hardening

### What was built
- **Atomic Incident Resolve Workflow (`POST /api/v1/incidents/:id/resolve`)**:
  - Implemented transactional resolve workflow inside a single `prisma.$transaction`.
  - Atomically marks incident status as `RESOLVED` and inserts the corresponding `PostMortem` record (`rootCause`, `resolutionSteps`, `timeSpentMinutes`).
  - Protected against race conditions (concurrent resolve attempts) by executing conditional `updateMany` with `where: { id, status: 'OPEN' }`. If count is 0, the service layer checks if the incident is missing (HTTP 404) or already resolved (HTTP 409 Conflict).
  - Returns HTTP 201 on success with the updated incident, its service, and the post-mortem.
- **Dashboard Stats Endpoint (`GET /api/v1/stats`)**:
  - Implemented layered stats architecture (`stats.routes.js`, `stats.controller.js`, `stats.service.js`, `stats.repository.js`).
  - Concurrently aggregates:
    - `openIncidents`: total count of `OPEN` incidents.
    - `openHighSeverity`: count of `OPEN` incidents with `HIGH` or `CRITICAL` severity.
    - `totalMinutesSpent`: sum of `PostMortem.timeSpentMinutes` (defaulting to 0 if no post-mortems exist).
- **Custom Validation Middleware**:
  - Handcrafted validation helpers without third-party libraries (`isNonEmptyString`, `isPositiveInteger`, `isValidEnum`).
  - Validates required fields, non-empty trimmed strings, sensible maximum lengths, enum values, and positive integers across service creation, incident creation, incident resolving, and query filtering.
  - Returns HTTP 400 with all validation problems listed in both message and details array.
- **Central Error Handling & Async Wrapper**:
  - Created custom `AppError` class (`message`, `statusCode`, `code`, `details`).
  - Created `asyncHandler` wrapper to eliminate repetitive `try / catch` boilerplate across controllers.
  - Mapped Prisma error codes:
    - `P2002` -> HTTP 409 `CONFLICT`
    - `P2025` -> HTTP 404 `NOT_FOUND`
    - `P2003` -> HTTP 400 `BAD_REQUEST`
  - Added catch-all route middleware for unknown routes returning JSON 404 (`{ "error": { "message": "Cannot GET /...", "code": "NOT_FOUND" } }`).
  - Masked unexpected 500 errors with generic client message while logging full error details on the server.
- **Backend Hardening**:
  - Restricted JSON body parsing to a 100kb limit (`express.json({ limit: '100kb' })`) returning HTTP 413 if exceeded.
  - Integrated `helmet` for secure HTTP headers.
  - Implemented rate limiting with `express-rate-limit` (300 requests per 15 minutes window under `/api`).
  - Restricted CORS origin strictly to `FRONTEND_URL` environment variable (`http://localhost:5173`).

### Files Added or Changed
- `backend/package.json` & `backend/package-lock.json`: Added `helmet` and `express-rate-limit` dependencies.
- `backend/.env` & `backend/.env.example`: Added `FRONTEND_URL` configuration.
- `backend/src/config/env.js`: Loaded `FRONTEND_URL` into centralized env config.
- `backend/src/errors/AppError.js`: Custom application error class.
- `backend/src/middleware/asyncHandler.js`: Higher-order function wrapping async route handlers.
- `backend/src/middleware/validate.js`: Validation helpers and middleware for services, incidents, resolve, and queries.
- `backend/src/middleware/errorHandler.js`: Enhanced central error handler with Prisma mapping, 100kb payload handling, and 500 masking.
- `backend/src/repositories/incident.repository.js`: Added atomic `executeResolveTransaction` with race-condition protection.
- `backend/src/services/incident.service.js`: Added `resolveIncident` business logic and AppError handling.
- `backend/src/controllers/incident.controller.js`: Added `resolveIncident` endpoint and converted handlers to `asyncHandler`.
- `backend/src/routes/incident.routes.js`: Added `POST /:id/resolve` route and validation middlewares.
- `backend/src/controllers/service.controller.js`: Converted handlers to `asyncHandler`.
- `backend/src/routes/service.routes.js`: Added `validateCreateService` middleware.
- `backend/src/repositories/stats.repository.js`: Database queries for dashboard metrics using Prisma.
- `backend/src/services/stats.service.js`: Business service for stats.
- `backend/src/controllers/stats.controller.js`: HTTP controller for stats.
- `backend/src/routes/stats.routes.js`: Maps `GET /` to stats controller.
- `backend/src/routes/index.js`: Mounted `/stats` under `/api/v1`.
- `backend/src/controllers/health.controller.js`: Converted to `asyncHandler`.
- `backend/src/app.js`: Integrated helmet, rate-limit, 100kb body limit, CORS origin, and 404 handler.
- `docs/PROGRESS.md`: Documented Phase 3 implementation details and testing.

### How to Run and Test
1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Resolve an Incident**:
   ```bash
   curl -i -X POST http://localhost:4000/api/v1/incidents/1/resolve \
     -H "Content-Type: application/json" \
     -d "{\"rootCause\":\"Memory leak in connection pool.\",\"resolutionSteps\":\"Added connection cleanup.\",\"timeSpentMinutes\":45}"
   ```
3. **Attempt Resolving an Already Resolved Incident (returns 409)**:
   ```bash
   curl -i -X POST http://localhost:4000/api/v1/incidents/1/resolve \
     -H "Content-Type: application/json" \
     -d "{\"rootCause\":\"Duplicate\",\"resolutionSteps\":\"None\",\"timeSpentMinutes\":10}"
   ```
4. **Fetch Stats**:
   ```bash
   curl -i http://localhost:4000/api/v1/stats
   ```
5. **Verify Validation Middleware (returns 400 with all errors)**:
   ```bash
   curl -i -X POST http://localhost:4000/api/v1/incidents \
     -H "Content-Type: application/json" \
     -d "{\"serviceId\":-1,\"title\":\"\",\"description\":\"\",\"severity\":\"BAD\"}"
   ```
6. **Verify Unknown Route (returns 404 JSON)**:
   ```bash
   curl -i http://localhost:4000/api/v1/unknown-route
   ```

### Anything You Need to Know
- `updateMany` inside `prisma.$transaction` guarantees PostgreSQL row-level locking during status updates, preventing race conditions without needing pessimistic locks or read-then-write checks.
- Rate limiting is set to 300 requests per 15-minute window for `/api` routes and includes standard `ratelimit-*` headers.
- Request payloads over 100kb are rejected with HTTP 413 `PAYLOAD_TOO_LARGE`.

## Phase 4: Seed script, API tests, API documentation

### What was built
- **Idempotent Database Seed Script (`backend/prisma/seed.js`)**:
  - Implemented repeatable database seeding in plain JavaScript.
  - Clears tables in dependency order (`PostMortem` -> `Incident` -> `Service`) within an atomic `prisma.$transaction`.
  - Seeds 3 baseline services:
    - `User Auth` (`PRODUCTION`)
    - `Billing Engine` (`PRODUCTION`)
    - `Notification API` (`STAGING`)
  - Seeds 3 baseline incidents:
    - 1 CRITICAL OPEN incident linked to `User Auth`.
    - 1 MEDIUM OPEN incident linked to `Notification API`.
    - 1 HIGH RESOLVED incident linked to `Billing Engine` with associated `PostMortem` (`timeSpentMinutes: 90`).
  - Configured `prisma.config.js` with `migrations: { seed: 'node prisma/seed.js' }` so `npx prisma db seed` works with Prisma 7.
  - Added npm script `"seed": "node prisma/seed.js"`.
  - Verified safe re-execution (running twice produces no errors or duplicate records).
- **Automated API Test Suite (`backend/tests/api.test.js`)**:
  - Built end-to-end integration tests using Node's native test runner (`node:test`), assertions (`node:assert/strict`), and native `fetch`.
  - Automatically spins up an in-process ephemeral test server on port 0, preventing port conflicts.
  - Generates isolated test data using unique timestamps without modifying or deleting seed data.
  - Added npm script `"test": "node --test tests/api.test.js"`.
  - 100% pass rate across 12 comprehensive test cases covering:
    - `GET /health` connectivity.
    - `GET /services` alphabetical sorting.
    - `POST /services` creation and HTTP 409 conflict handling.
    - `POST /incidents` creation and HTTP 400 validation checking.
    - `POST /incidents/:id/resolve` atomic resolution with post-mortem, duplicate 409 rejection, and missing 404 detection.
    - `GET /incidents` status filtering (`OPEN`, `RESOLVED`, `ALL`) and pagination mechanics (`skip`, `take`, envelope).
    - `GET /stats` summary calculations (`openIncidents`, `openHighSeverity`, `totalMinutesSpent`).
- **Complete REST API Documentation (`docs/API.md`)**:
  - Documented all endpoints under `/api/v1` (`/health`, `/services`, `/incidents`, `/incidents/:id`, `/incidents/:id/resolve`, `/stats`).
  - Documented methods, paths, query/body specifications, full JSON examples for requests and responses, HTTP status codes, validation error formats, and hardening headers.

### Files Added or Changed
- `backend/prisma/seed.js`: Database seeder script inserting baseline services, incidents, and post-mortems.
- `backend/prisma.config.js`: Registered `seed` command in Prisma 7 configuration.
- `backend/package.json`: Added `seed` and `test` scripts, plus Prisma seed metadata.
- `backend/tests/api.test.js`: Integration test suite using `node:test` and `fetch`.
- `docs/API.md`: Comprehensive REST API documentation.
- `docs/PROGRESS.md`: Documented Phase 4 deliverables, seed instructions, and test runs.

### How to Run and Test
1. **Seed the database**:
   ```bash
   cd backend
   npm run seed
   ```
   Or via Prisma CLI:
   ```bash
   cd backend
   npx prisma db seed
   ```
2. **Run the automated API test suite**:
   ```bash
   cd backend
   npm test
   ```
3. **Inspect the API documentation**:
   Open `docs/API.md`.

### Anything You Need to Know
- The seed script truncates/deletes records using a transaction so it can be re-run indefinitely without duplicate key violations.
- The test runner binds to an ephemeral OS-assigned port (`app.listen(0)`), allowing tests to execute independently whether or not the development server is actively running.

## Phase 5: Frontend foundation (Vite, Tailwind, Router, Axios, Query Client)

### What was built
- **Vite + React Project Setup (Plain JavaScript, `.jsx`)**:
  - Initialized React application with Vite in `frontend/` using JavaScript template (no TypeScript, zero `.ts`/`.tsx` files).
  - Configured `@tailwindcss/vite` in `vite.config.js` and imported Tailwind in `src/index.css`.
  - Configured default dark theme with dark background (`#090d16`), light text, and clean typography.
- **Dependencies Installed**:
  - `react-router-dom`: Client-side routing with layout and nested routes.
  - `axios`: Centralized HTTP client.
  - `@tanstack/react-query`: Server state synchronization, caching, and custom query hooks.
  - `react-hook-form`: Form management and validation for subsequent phases.
- **Architecture & Directory Structure**:
  - `src/api/client.js`: Centralized Axios instance configured with `baseURL` from `import.meta.env.VITE_API_URL` (defaults to `http://localhost:4000/api/v1`).
    - Configured response interceptor to unwrap JSON data and normalize backend error envelopes into standard JavaScript `Error` objects with backend error messages.
  - `src/api/`: Modular API resource clients (`incidentApi.js`, `serviceApi.js`, `statsApi.js`).
  - `src/hooks/`: Custom query hooks wrapping TanStack React Query (`useIncidents`, `useIncident`, `useServices`, `useStats`).
  - `src/components/ErrorBoundary.jsx`: Class component error boundary with graceful fallback UI and a "Try again" retry button.
  - `src/layouts/AppLayout.jsx`: Top navigation bar with "DevLog" branding, active link navigation styling (`NavLink`), and error boundary wrapping `<Outlet />`.
  - `src/pages/`: Placeholder pages for `DashboardPage.jsx` and `ServicesPage.jsx`.
- **Environment & Routing Setup**:
  - Created `frontend/.env` and `frontend/.env.example` defining `VITE_API_URL=http://localhost:4000/api/v1`.
  - Configured `QueryClientProvider` and `BrowserRouter` in `src/App.jsx` with routes:
    - `/` -> `DashboardPage`
    - `/services` -> `ServicesPage`
    - Catch-all fallback redirect to `/`
  - Verified backend `FRONTEND_URL` (`http://localhost:5173`) matches Vite development port (`5173`) for CORS compatibility.

### Files Added or Changed
- `frontend/package.json`: Frontend manifest with React, Vite, Tailwind, Router, Axios, React Query, React Hook Form.
- `frontend/vite.config.js`: Vite configuration with React and Tailwind plugins on port 5173.
- `frontend/index.html`: Configured title and dark mode root class.
- `frontend/.env` & `frontend/.env.example`: Configured `VITE_API_URL`.
- `frontend/.gitignore`: Added environment files and dependencies to gitignore.
- `frontend/src/index.css`: Global dark theme styling with Tailwind CSS import.
- `frontend/src/api/client.js`: Axios instance with response error interceptor.
- `frontend/src/api/incidentApi.js`: API helper methods for incidents.
- `frontend/src/api/serviceApi.js`: API helper methods for services.
- `frontend/src/api/statsApi.js`: API helper method for stats.
- `frontend/src/hooks/useIncidents.js`: Custom TanStack Query hook for incidents.
- `frontend/src/hooks/useServices.js`: Custom TanStack Query hook for services.
- `frontend/src/hooks/useStats.js`: Custom TanStack Query hook for dashboard metrics.
- `frontend/src/components/ErrorBoundary.jsx`: Error boundary component with retry support.
- `frontend/src/layouts/AppLayout.jsx`: Application shell with responsive top bar and active link highlighting.
- `frontend/src/pages/DashboardPage.jsx`: Dashboard page placeholder.
- `frontend/src/pages/ServicesPage.jsx`: Services page placeholder.
- `frontend/src/App.jsx`: QueryClient and React Router integration.
- `docs/PROGRESS.md`: Documented Phase 5 frontend foundation.

### How to Run and Test
1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.
3. **Build Frontend for Production**:
   ```bash
   cd frontend
   npm run build
   ```

### Anything You Need to Know
- Frontend uses pure JavaScript (`.jsx`) with no TypeScript.
- The Axios response interceptor directly unwraps `response.data` on success and converts `{ error: { message } }` into `new Error(message)` on failure.

## Phase 6: Dashboard and Services pages (reading data only)

### What was built
- **Dashboard Page (`frontend/src/pages/DashboardPage.jsx`)**:
  - Integrated `useStats()` hook to display 3 summary cards:
    - Active incidents (`openIncidents`).
    - High-severity open (`openHighSeverity`).
    - Total time spent (`totalMinutesSpent` formatted cleanly as `"Xh Ym"`).
  - Incidents table displaying:
    - Title with preview description.
    - Associated Service name with environment badge.
    - Severity pill with colors: LOW (green), MEDIUM (yellow), HIGH (orange), CRITICAL (red).
    - Status badge with distinct colors for OPEN (blue) and RESOLVED (purple).
    - Formatted creation date.
  - Interactive Filter Tabs: `All`, `Open`, `Resolved`. Switching tabs resets pagination to page 1.
  - Pagination controls showing `"Page X of Y"`, disabling Previous at page 1 and Next at page Y.
  - Smooth pagination transitions keeping existing rows visible using TanStack Query's `keepPreviousData`.
  - Comprehensive UI states: loading spinner, empty state ("No incidents yet"), and error state with retry.
- **Services Page (`frontend/src/pages/ServicesPage.jsx`)**:
  - Integrated `useServices()` hook to display registered services.
  - Services table columns: Name, Environment (colored badge), Date Created.
  - Loading, error (with retry button), and empty states.
- **Reusable Component Library (`frontend/src/components/`)**:
  - `StatCard.jsx`: Metric card with title, large numeric value, icon, and description.
  - `SeverityPill.jsx`: Colored pill badges matching severity standards (green, yellow, orange, red).
  - `StatusBadge.jsx`: Clearly differentiated badges for OPEN and RESOLVED statuses.
  - `EnvironmentBadge.jsx`: Environment badges for PRODUCTION, STAGING, and QA.
  - `FilterTabs.jsx`: Tab switcher for incident status filters.
  - `Pagination.jsx`: Pagination controls with disabled boundary states.
  - `Spinner.jsx`: Accessible loading indicator.
  - `ErrorMessage.jsx`: Error alert box with retry button.
  - `EmptyState.jsx`: Empty placeholder component.
- **Query Hooks Updated (`frontend/src/hooks/useIncidents.js`)**:
  - Added `placeholderData: keepPreviousData` to cache previous pages during query transitions.

### Files Added or Changed
- `frontend/src/components/StatCard.jsx`: Reusable metric card component.
- `frontend/src/components/SeverityPill.jsx`: Colored pill for LOW, MEDIUM, HIGH, CRITICAL.
- `frontend/src/components/StatusBadge.jsx`: Distinct badge for OPEN and RESOLVED.
- `frontend/src/components/EnvironmentBadge.jsx`: Badges for PRODUCTION, STAGING, QA.
- `frontend/src/components/FilterTabs.jsx`: Tab switcher for incident status filters.
- `frontend/src/components/Pagination.jsx`: Pagination controls with disabled boundary states.
- `frontend/src/components/Spinner.jsx`: Loading indicator component.
- `frontend/src/components/ErrorMessage.jsx`: Error alert box with retry button.
- `frontend/src/components/EmptyState.jsx`: Empty placeholder component.
- `frontend/src/hooks/useIncidents.js`: Added `keepPreviousData` to preserve table rows between pages.
- `frontend/src/pages/DashboardPage.jsx`: Real-time incident dashboard with stats cards, filter tabs, and paginated table.
- `frontend/src/pages/ServicesPage.jsx`: Services registry table with environment badges.
- `docs/PROGRESS.md`: Documented Phase 6 frontend components and features.

### How to Run and Test
1. **Start backend and frontend**:
   ```bash
   # Terminal 1: backend
   cd backend && npm run dev

   # Terminal 2: frontend
   cd frontend && npm run dev
   ```
2. **View Dashboard**:
   - Open `http://localhost:5173/`.
   - Verify 3 summary cards (Active Incidents, High-Severity Open, Total Time Spent).
   - Test clicking filter tabs: `All`, `Open`, `Resolved`.
   - Test pagination controls.
3. **View Services Registry**:
   - Navigate to `http://localhost:5173/services`.
   - Verify services table displays `Billing Engine`, `Notification API`, and `User Auth`.

Phase 6 complete

## Phase 7: Forms, mutations, post-mortem view, polling

### What was built
- **Reusable Modal Primitive (`frontend/src/components/Modal.jsx`)**:
  - Accessible modal dialog component featuring a semi-transparent backdrop overlay.
  - Closes on `Escape` key press and backdrop click.
  - Accessible focus management: automatically captures and moves focus into the modal container upon opening and restores focus to the previously active element upon closing.
  - Scrollable container on small screens with `max-h-[90vh]` and body scroll lock.
- **Add Incident Modal (`frontend/src/components/AddIncidentModal.jsx`)**:
  - Opened via the "Add Incident" button in the dashboard header.
  - Built with `react-hook-form` with client-side validation:
    - Service dropdown: populated from `useServices()` with validation.
    - Title: required (3 to 255 characters).
    - Description: required (5 to 2000 characters).
    - Severity: select dropdown (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - Validation error feedback rendered directly beneath each field.
  - Inline backend API error banner displaying server errors without closing the modal.
  - Submit button with spinner and disabled states while submitting.
- **Resolve & Post-Mortem Modal (`frontend/src/components/ResolveIncidentModal.jsx`)**:
  - Triggered via the "Resolve & Post-Mortem" action button on every `OPEN` incident row.
  - Form built with `react-hook-form`:
    - Root Cause textarea (required, minimum 5 characters).
    - Resolution Steps textarea (required, minimum 5 characters).
    - Time spent in minutes (positive integer, minimum 1 minute).
  - Displays incident and service context summary card.
  - Handles backend 409 Conflict (e.g. already resolved race condition) by rendering the server error message inside the modal without dismissing it.
  - Submit button with loading spinner and disabled state during mutation execution.
- **Post-Mortem Detail View (`frontend/src/components/PostMortemModal.jsx`)**:
  - Triggered by clicking any `RESOLVED` table row or its "View Post-Mortem" button.
  - Fetches the latest incident record with full post-mortem details using `useIncident(id)`.
  - Displays incident overview (Title, Description, Service name with Environment badge, Severity pill, Status badge, and timestamps).
  - Shows resolution metrics: time spent formatted in hours and minutes, resolved date, root cause card, and resolution steps card.
- **Register Service Modal (`frontend/src/components/RegisterServiceModal.jsx`)**:
  - Triggered via the "Register Service" button on the Services page header.
  - Collects service name (2 to 100 characters) and environment (`PRODUCTION`, `STAGING`, `QA`).
  - Displays client validation errors and backend 409 Conflict errors (duplicate name + environment) inside the modal.
- **Mutations & Cache Invalidation**:
  - `useCreateIncident`: calls `createIncident(data)` and invalidates `["incidents"]` and `["stats"]`.
  - `useResolveIncident`: calls `resolveIncident(id, data)` and invalidates `["incidents"]`, `["stats"]`, and `["incident", id]`.
  - `useCreateService`: calls `createService(data)` and invalidates `["services"]`.
  - All mutations ensure instant UI updates across the application without requiring a page reload.
- **Dashboard Polling & Data Freshness**:
  - Configured 30-second polling (`refetchInterval: 30000`) and window focus refetching (`refetchOnWindowFocus: true`) in `useStats` and `useIncidents`.
- **Error Boundary**:
  - Verified `ErrorBoundary` wraps the routed pages via `AppLayout.jsx` for graceful error recovery.

### Files Added or Changed
- `frontend/src/components/Modal.jsx`: Reusable accessible modal dialog component.
- `frontend/src/components/AddIncidentModal.jsx`: Modal form to log new incidents with React Hook Form.
- `frontend/src/components/ResolveIncidentModal.jsx`: Modal form to resolve incidents and submit post-mortems.
- `frontend/src/components/PostMortemModal.jsx`: Modal detail view displaying resolved incidents and post-mortems.
- `frontend/src/components/RegisterServiceModal.jsx`: Modal form to register new services on the Services page.
- `frontend/src/hooks/useCreateIncident.js`: Mutation hook for incident creation with query invalidation.
- `frontend/src/hooks/useResolveIncident.js`: Mutation hook for incident resolution with query invalidation.
- `frontend/src/hooks/useCreateService.js`: Mutation hook for service registration with query invalidation.
- `frontend/src/hooks/useIncidents.js`: Added 30-second polling, window focus refetching, and mutation re-exports.
- `frontend/src/hooks/useServices.js`: Re-exported `useCreateService`.
- `frontend/src/hooks/useStats.js`: Added 30-second polling and window focus refetching.
- `frontend/src/pages/DashboardPage.jsx`: Added Add Incident button, Resolve buttons, Post-Mortem triggers, and modals.
- `frontend/src/pages/ServicesPage.jsx`: Added Register Service button and RegisterServiceModal.
- `docs/PROGRESS.md`: Documented Phase 7 implementation details.

### How to Run and Test
1. **Start backend and frontend**:
   ```bash
   # Terminal 1: backend
   cd backend && npm run dev

   # Terminal 2: frontend
   cd frontend && npm run dev
   ```
2. **Test Adding an Incident**:
   - On the Dashboard (`http://localhost:5173/` or `http://localhost:5174/`), click **Add Incident**.
   - Verify validation errors appear when submitting empty fields.
   - Fill in service, title, description, and severity, then submit.
   - Verify the modal closes, the button shows a spinner while saving, and the new incident appears in the table immediately.
3. **Test Resolving an Incident**:
   - On any `OPEN` incident, click **Resolve & Post-Mortem**.
   - Enter root cause, resolution steps, and time spent (e.g. 45), then click **Resolve & Save Post-Mortem**.
   - Verify the modal closes, the row status flips to `RESOLVED`, and the summary metrics (active count and total time spent) update automatically.
4. **Test Post-Mortem View**:
   - Click on the resolved incident row or click **View Post-Mortem**.
   - Verify the post-mortem modal loads the full root cause, resolution steps, time spent, and resolution date.
5. **Test Registering a Service**:
   - Go to `http://localhost:5173/services` and click **Register Service**.
   - Enter name and environment, then click **Register Service**.
   - Verify the service immediately appears in the table.

Phase 7 complete

## Phase 8: Database performance and analytics

### What was built
- **Bulk Data Generator & Reset Scripts (`backend/prisma/seed-bulk.js`)**:
  - Implemented `seed-bulk.js` and registered the `"seed:bulk"` npm script. Generates and inserts 20,000 realistic synthetic incidents (~5% OPEN, ~95% RESOLVED with corresponding post-mortems) spread randomly across registered services and over 365 days.
  - Uses high-throughput batching (`prisma.incident.createManyAndReturn` in chunks of 2,500) to insert all 20,000 incidents and ~19,000 post-mortems in ~3.8 seconds.
  - Added the `"seed:reset"` npm script to instantly wipe bulk data and re-seed the clean 3-service, 3-incident development baseline.
- **Partial B-Tree Index Migration**:
  - Generated and applied a dedicated database migration `20261024054943_add_partial_open_incident_index` containing:
    ```sql
    CREATE INDEX "Incident_open_createdAt_idx" ON "Incident" ("createdAt" DESC)
    WHERE status = 'OPEN';
    ```
  - Verified presence and definition in PostgreSQL catalog `pg_indexes`.
- **Comprehensive Performance & Architecture Report (`docs/PERFORMANCE.md`)**:
  - Captured and analyzed real PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, COSTS)` execution plans for:
    - Query A: "Open incidents newest first, page 1" (comparing Seq Scan vs. Index Scan).
    - Query B: "All incidents for one service" (comparing Seq Scan vs. Bitmap Index Scan).
  - Demonstrates that the partial index reduces Query A execution time from **1.513 ms down to 0.043 ms (35x speedup)** and cuts buffer I/O from 527 disk pages to 10 pages.
  - Measured on-disk catalog footprints showing the partial index requires only **40 kB** compared to **632 kB** for the full compound index (over 15x smaller).
  - Provided clear, student-friendly technical sections explaining:
    - The N+1 query problem and how Prisma's relation batching avoids it.
    - PostgreSQL default isolation level (Read Committed), MVCC versioning, and the atomic `updateMany` guard preventing concurrent resolution race conditions.
    - Prisma connection pool sizing (`cpus * 2 + 1`) and the necessity of a single shared `PrismaClient`.
- **Analytics Endpoint with CTE and Window Function (`GET /api/v1/stats/services`)**:
  - Implemented strict layered architecture: route -> controller -> service -> repository.
  - Built with `prisma.$queryRaw` using a tagged template string, a Common Table Expression (`WITH service_metrics AS (...)`), and a window function:
    ```sql
    RANK() OVER (ORDER BY "totalMinutesSpent" DESC)::INTEGER AS rank
    ```
  - Returns for each service: `incidentCount`, `resolvedCount`, `totalMinutesSpent`, `avgMinutesPerResolved`, and `rank`.
  - Casts all database counts, ranks, and sums to standard 32-bit `INTEGER` / `FLOAT` types to prevent Node.js `BigInt` serialization crashes.
- **Frontend Service Analytics Visualizer (`frontend/src/components/ServiceStatsCard.jsx`)**:
  - Added an analytics card to the Dashboard showing services ranked by time spent.
  - Features rank badges, normalized proportional horizontal progress bars, resolved/total incident counts, and average resolution times.
  - Powered by custom hook `useServiceStats()` in `frontend/src/hooks/useServiceStats.js` with automatic 30-second polling and window focus refetching.
- **Automated Test Coverage**:
  - Added test case #13 to `backend/tests/api.test.js` verifying the `/stats/services` endpoint, HTTP 200 response, payload schema, numerical data types, and monotonic descending rank ordering.

### Files Added or Changed
- `backend/prisma/migrations/20261024054943_add_partial_open_incident_index/migration.sql`: Custom migration adding partial index on open incidents.
- `backend/prisma/seed-bulk.js`: Fast bulk seeding script generating 20,000 incidents with post-mortems.
- `backend/package.json`: Registered `"seed:bulk"` and `"seed:reset"` npm scripts.
- `backend/src/repositories/stats.repository.js`: Added `getServiceStats` with CTE, window function, and BigInt casting.
- `backend/src/services/stats.service.js`: Added `getServiceStats` service method.
- `backend/src/controllers/stats.controller.js`: Added `getServiceStats` controller action.
- `backend/src/routes/stats.routes.js`: Mounted `GET /services` on stats router.
- `backend/tests/api.test.js`: Added automated test for `GET /stats/services`.
- `docs/PERFORMANCE.md`: Comprehensive performance analysis, EXPLAIN ANALYZE benchmarks, and database design notes.
- `frontend/src/api/statsApi.js`: Added `getServiceStats` API function.
- `frontend/src/hooks/useStats.js`: Exported `useServiceStats` hook.
- `frontend/src/hooks/useServiceStats.js`: Custom hook fetching service-level resolution analytics.
- `frontend/src/components/ServiceStatsCard.jsx`: Dashboard visualizer displaying service resolution time rankings and progress bars.
- `frontend/src/pages/DashboardPage.jsx`: Rendered `<ServiceStatsCard />` on the dashboard.
- `.gitignore`: Added `scratch/` directory.
- `docs/PROGRESS.md`: Documented Phase 8 implementation.

### How to Run and Test
1. **Run Bulk Seeding & Benchmarks**:
   ```bash
   cd backend
   npm run seed:bulk
   ```
2. **Run Tests**:
   ```bash
   npm test
   ```
   Verify all 13 tests pass.
3. **Reset Database to Clean Baseline**:
   ```bash
   npm run seed:reset
   ```
4. **View Frontend Dashboard**:
   - Open `http://localhost:5173/`.
   - Verify the "Time Spent by Service" card renders the ranked service list with progress bars and resolution time statistics alongside the incidents table.

Phase 8 complete

## Phase 9: Quality pass, README, cleanup

### What was built
- **Cleanliness & Architecture Compliance Audit**:
  - Confirmed zero TypeScript files (`.ts` or `.tsx`) in the entire repository.
  - Confirmed zero MongoDB code or drivers across all modules (pure PostgreSQL with Prisma ORM).
  - Verified Git commit history to ensure `.env` and sensitive secrets were never committed.
  - Audited code for extraneous `console.log` debugging statements, leaving only essential server startup and ErrorBoundary lifecycle logging.
- **Root Documentation (`README.md`)**:
  - Created a comprehensive root `README.md` providing:
    - High-level project summary and college mini-project context.
    - Full tech stack matrix (Node.js, Express, Prisma, PostgreSQL, React, Tailwind CSS, TanStack Query).
    - Prerequisites and step-by-step setup instructions from database creation to server launch.
    - Testing instructions (`npm test`, `npm run seed:bulk`, `npm run seed:reset`).
    - Clean repository folder tree breakdown.
    - Complete API reference overview table linking to `docs/API.md`.
    - Key architectural highlights: layered design, atomic resolve transaction with `updateMany` concurrency guard, partial B-Tree indexes, and CTE window functions.
- **API Documentation (`docs/API.md`)**:
  - Updated `docs/API.md` with complete documentation for `GET /api/v1/stats/services`, detailing CTE metrics, `RANK() OVER` window ordering, and BigInt-safe integer response types.
- **Responsive Layout & Text Overflow Hardening**:
  - Added `max-w-xs sm:max-w-md break-words` constraints to incident titles and descriptions on `DashboardPage.jsx` and service names on `ServicesPage.jsx`.
  - Tested on laptop widths and mobile viewports, ensuring horizontal tables scroll smoothly with `overflow-x-auto` without breaking card layouts or navigation headers.
- **Edge Cases & Walkthrough Validation**:
  - Empty database: tested clean empty state representations for incidents, services, and analytics cards.
  - Backend offline: verified Axios interceptor and UI `ErrorMessage` banners with retry triggers.
  - Double-click prevention: form submission buttons disabled during mutation execution (`isPending` state) with spinner animations.
  - Atomic concurrency: verified that duplicate resolve attempts return standard `409 Conflict` errors displayed inside the modal without closing it.
  - Invalid route routing: unknown paths redirect automatically to `/`.

### Files Added or Changed
- `README.md`: Root project overview, setup guide, testing documentation, and architecture breakdown.
- `docs/API.md`: Documented `GET /api/v1/stats/services` endpoint schema and ranking semantics.
- `frontend/src/pages/DashboardPage.jsx`: Added text wrapping and max-width constraints to table cells.
- `frontend/src/pages/ServicesPage.jsx`: Added text wrapping and max-width constraints to service rows.
- `docs/PROGRESS.md`: Documented Phase 9 quality pass.

### How to Run and Test
1. **Run Automated Tests**:
   ```bash
   cd backend && npm test
   ```
   *Expected: All 13 tests pass.*
2. **Build Frontend**:
   ```bash
   cd frontend && npm run build
   ```
   *Expected: Clean production bundle compiled with 0 errors.*
3. **Verify Dev Servers**:
   - Backend: `http://localhost:4000/api/v1/health` -> `{"status":"ok","database":"up"}`
   - Frontend: `http://localhost:5173/` -> live dashboard with stats cards, analytics visualizer, and incidents table.






