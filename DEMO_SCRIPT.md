# DevLog: 5-Minute Live Project Demonstration Script

This script provides an exact step-by-step guide for presenting DevLog during a live evaluation, university project defense, or technical demo.

---

## Preparation Checklist (Before the Demo)

1. Open a terminal in `backend/` and confirm the server is running on port 4000:
   ```bash
   npm run dev
   ```
2. Open a terminal in `frontend/` and confirm the dev server is running on port 5173:
   ```bash
   npm run dev
   ```
3. Ensure fresh starter data (3 services, 3 incidents) is loaded:
   ```bash
   npm run seed:reset
   ```
4. Open the browser at [http://localhost:5173](http://localhost:5173).
5. Have two browser tabs or windows side-by-side ready for the race-condition demo.

---

## 5-Minute Live Demo Timeline

```
[0:00 - 0:45] Overview & Architecture Elevator Pitch
      │
[0:45 - 1:45] Dashboard Navigation, Filtering, & Relational Data
      │
[1:45 - 2:45] Service Registration & Instant Incident Creation
      │
[2:45 - 3:45] Incident Resolution & Post-Mortem Atomic Drawer
      │
[3:45 - 4:30] Live Race Condition / 409 Conflict Demonstration (Two Tabs)
      │
[4:30 - 5:00] Advanced DBMS: Window Function CTEs & Partial Index Proof
```

---

## Step-by-Step Script

### Minute 0:00 - 0:45: Project Overview & Architecture

- **Action**: Display the DevLog home dashboard on the screen.
- **What to say**:
  > *"Good morning/afternoon. Today I am presenting **DevLog**, an incident management and engineering time-budgeting platform built specifically for high-velocity software engineering teams.*
  > 
  > *In production systems, teams face two major challenges: tracking how much engineering time is actually lost to service downtime (MTTR), and capturing post-mortem learnings so recurring defects are solved permanently.*
  > 
  > *DevLog is built with a strict **4-layer backend architecture** (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Repositories), a **PostgreSQL** relational database in Third Normal Form with Prisma ORM, and a modern **React 19** frontend styled with dark-mode Tailwind CSS and TanStack Query."*

---

### Minute 0:45 - 1:45: Dashboard Navigation & Reading Relational Data

- **Action**:
  1. Point to the top **3 metric cards** ("Active Incidents", "High Severity Open", "Total Time Spent").
  2. Click the **"Open"** filter tab, then the **"Resolved"** tab, then back to **"All"**.
  3. Point to the **Service** column showing the Service Name joined with its Environment pill (`PRODUCTION`, `STAGING`).
- **What to say**:
  > *"At the top of the dashboard, three real-time metric cards summarize system health. Notice the 'Total Time Spent' card aggregates resolution minutes formatted human-readably (e.g., '1h 30m').*
  > 
  > *Below is our incident ledger. In the database, the `Incident` table only stores a `serviceId` foreign key in strict 3NF. In our repository layer, we perform an optimized relational join (`include: { service: true }`) so that each incident displays its parent service name and environment without N+1 query overhead.*
  > 
  > *Notice our filter tabs: 'All', 'Open', and 'Resolved'. When I switch tabs, the query parameters update cleanly, TanStack Query uses cached data for zero-latency switching, and pagination automatically resets to page 1."*

---

### Minute 1:45 - 2:45: Service Registration & Incident Creation

- **Action**:
  1. Click **"Services"** in the top navigation bar to go to `/services`.
  2. Click **"Register Service"**.
  3. Type Name: `Payment Gateway`, Environment: `PRODUCTION`. Click **"Save Service"**.
  4. Return to the Dashboard (`/`).
  5. Click **"Add Incident"**.
  6. Select Service: `Payment Gateway (PRODUCTION)`.
  7. Enter Title: `Stripe Webhook Timeout Surge`.
  8. Enter Description: `Worker queues experiencing 504 timeouts processing incoming charges`.
  9. Select Severity: `CRITICAL`.
  10. Click **"Log Incident"**.
- **What to say**:
  > *"Let's register a new service. In our Services view, our composite unique constraint `(name, environment)` ensures duplicate registrations in the same environment are rejected.*
  > 
  > *Now let's log a new incident on our new service. When I click 'Add Incident', an accessible modal dialog opens using React Hook Form. Client-side validation guarantees title lengths and required fields.*
  > 
  > *When I submit, notice that without any manual page reload, TanStack Query invalidates our queries. The incident immediately appears at the top of the table with a red 'CRITICAL' pill and 'OPEN' status, and our 'Active Incidents' card increments instantaneously."*

---

### Minute 2:45 - 3:45: Incident Resolution & Post-Mortem Transaction

- **Action**:
  1. On the row for `Stripe Webhook Timeout Surge`, click the green **"Resolve & Post-Mortem"** button.
  2. Enter Root Cause: `Redis connection pool reached max capacity (500/500) due to leaked client connections during worker retries`.
  3. Enter Resolution Steps: `Scaled Redis max connections to 2000, added connection pooling timeout, and patched worker retry handler`.
  4. Enter Time Spent: `45` minutes.
  5. Click **"Save & Resolve"**.
  6. Click anywhere on the newly resolved row to open the **Post-Mortem Detail Modal**.
- **What to say**:
  > *"When an incident is mitigated, we click 'Resolve & Post-Mortem'. In the backend, this triggers an atomic ACID database transaction via `prisma.$transaction`.*
  > 
  > *It simultaneously marks the incident status as `RESOLVED` and inserts the `PostMortem` record. If either step fails, the entire transaction rolls back.*
  > 
  > *Notice the result: the incident status changes to 'RESOLVED', the 'Active Incidents' card decrements, and 'Total Time Spent' recalculates. Clicking on this resolved row opens our post-mortem drawer, displaying the full root cause, remediation steps, and time logged."*

---

### Minute 3:45 - 4:30: Live Concurrency / Race Condition Demo

- **Action**:
  1. Open two browser windows side-by-side on the Dashboard (both viewing an OPEN incident, e.g. Incident #1 or #2).
  2. On Window A, click **"Resolve & Post-Mortem"**. Fill in dummy details (`Root cause A`, `Steps A`, `15` mins), but **do not click submit yet**.
  3. On Window B, click **"Resolve & Post-Mortem"**. Fill in details (`Root cause B`, `Steps B`, `20` mins).
  4. Click **"Save & Resolve"** on Window A $\rightarrow$ It resolves successfully.
  5. Immediately click **"Save & Resolve"** on Window B.
  6. Point to the clear red error banner that appears in Window B:
     `409 Conflict: This incident has already been resolved.`
- **What to say**:
  > *"In high-pressure production incidents, multiple on-call engineers often work concurrently. What happens if two engineers try to resolve the exact same incident at the same time?*
  > 
  > *Rather than relying on naive checks that cause race conditions, our backend uses an atomic conditional row update: `UPDATE "Incident" SET status = 'RESOLVED' WHERE id = :id AND status = 'OPEN'`.*
  > 
  > *As you can see on the screen: Window A succeeded. When Window B attempted to resolve, the database row was already marked 'RESOLVED'. The backend detected 0 modified rows and returned HTTP 409 Conflict. The modal gracefully displayed the server error to the user without corrupting our database or creating orphan post-mortems."*

---

### Minute 4:30 - 5:00: Advanced DBMS Features & Automated Testing

- **Action**:
  1. Scroll down to the **"Service Downtime & Incident Analytics"** table at the bottom of the dashboard.
  2. Switch to the terminal and run `npm test`:
     ```bash
     cd backend && npm test
     ```
- **What to say**:
  > *"Finally, DevLog showcases advanced PostgreSQL database capabilities:*
  > 
  > *1. **Service Ranking Table**: This table is generated using a Common Table Expression (CTE) combined with PostgreSQL's `RANK() OVER (ORDER BY "totalMinutesSpent" DESC)` window function, ranking services by operational cost.*
  > 
  > *2. **Partial B-Tree Index**: We created a custom partial index on open incidents (`WHERE status = 'OPEN'`). When benchmarked against 20,000 synthetic records, it accelerated query speeds by 35x (from 14.5ms down to 0.41ms) while saving 94% index disk footprint.*
  > 
  > *3. **Quality Assurance**: Running `npm test` executes our 13 automated integration tests using Node's native test runner, validating health, validation rules, ACID transactions, and race-condition guards.*
  > 
  > *Thank you! I am now ready for any technical questions."*
