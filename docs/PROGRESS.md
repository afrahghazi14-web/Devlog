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
