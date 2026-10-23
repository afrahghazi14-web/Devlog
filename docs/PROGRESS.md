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
