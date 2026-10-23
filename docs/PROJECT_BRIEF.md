# DevLog - Project Brief (single source of truth)

## What it is
DevLog: Time-Budgeted Incident & Post-Mortem Logger. Small engineering teams register
services, log production incidents against them, record how long the fix took, and keep a
post-mortem (root cause + resolution steps) for future reference.
This is a college mini project (internals). It will be graded on a report, a live demo and
a viva, so the code must be SIMPLE, CLEAN and EXPLAINABLE by a second-year student.

## Hard rules
- Plain JavaScript ONLY. No TypeScript. No .ts or .tsx files anywhere.
- Backend uses ES modules (type: module). Frontend is React + Vite (.jsx files).
- No login / authentication (out of scope). No MongoDB (PostgreSQL only).
- Keep dependencies minimal. Prefer readable code over clever code.
- Comments explain WHY, not what. Use clear names.
- Never commit secrets. .env is git-ignored; .env.example is committed.
- After every phase: run it, test it, fix it, update docs/PROGRESS.md, commit.

## Stack
- Backend: Node.js, Express, Prisma ORM, PostgreSQL.
- Frontend: React (Vite), Tailwind CSS, React Router, Axios, TanStack Query,
  React Hook Form.

## Backend architecture (layered)
routes -> controllers -> services -> repositories
- routes: map URL + method to a controller.
- controllers: read the request, call a service, send the response. No database code.
- services: business rules (e.g. cannot resolve an already resolved incident).
- repositories: the ONLY place that imports Prisma and talks to the database.
- middleware: request validation, error handling.
- All endpoints live under /api/v1.
- Errors always return JSON: { "error": { "message": "...", "code": "..." } }.
- Correct HTTP status codes: 200, 201, 400, 404, 409, 500.

## Data model
- Service: id, name, environment (PRODUCTION | STAGING | QA), createdAt.
  name + environment must be unique together.
- Incident: id, title, description, severity (LOW | MEDIUM | HIGH | CRITICAL),
  status (OPEN | RESOLVED, default OPEN), createdAt, serviceId (required, belongs to a
  Service).
- PostMortem: id, rootCause, resolutionSteps, timeSpentMinutes, createdAt, incidentId
  (unique, so one incident has at most one post-mortem).
- Resolving an incident must, in ONE database transaction, set status to RESOLVED AND
  create the PostMortem. Both succeed or neither does.

## Features
1. Service registry: list and register services.
2. Incident dashboard: summary cards (active incidents, high-severity open incidents,
   total minutes spent on resolutions), incidents table (Title, Service, Severity pill,
   Status badge, Date created), tabs All/Open/Resolved, Previous/Next pagination.
3. Log new incident (modal): service dropdown, title, description, severity.
4. Resolve incident (modal): root cause, resolution steps, time spent (minutes).
5. Post-mortem detail view (drawer or modal) for resolved incidents.
6. Seed data: 3 services and 3 incidents (2 open, 1 resolved with a post-mortem).

## UI rules
- Clean dark-mode developer UI with Tailwind.
- Severity pills: LOW green, MEDIUM yellow, HIGH orange, CRITICAL red.
- Buttons show a loading spinner while submitting. Show clear error messages when an API
  call fails. The UI updates instantly after a form succeeds (no page reload).

## Syllabus this project must visibly demonstrate
Backend: REST + CRUD + status codes, middleware, validation, central error handling,
layered design (controllers/services/repositories), transactions, race-condition
protection, pagination + filtering, API versioning, API hardening.
Full stack: Git workflow, custom hooks, React Hook Form, Context or reducer where natural,
error boundaries, nested/layout routes, Axios instance + env vars, TanStack Query queries
and mutations with cache invalidation, API error handling, relational data in React,
filtering + pagination end to end, data freshness (polling / refetch on focus).
Advanced DBMS (PostgreSQL + Prisma): ER design, normalisation, constraints, composite and
partial indexes, CTEs and window functions, transactions and isolation, EXPLAIN ANALYZE,
Prisma migrations, relations, N+1 avoidance, $transaction, $queryRaw, connection pooling,
Prisma error handling.
