import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

// Automated API test suite built with Node.js native test runner (node:test) and native fetch.
// Tests create their own isolated test data using unique timestamps and never delete seed data.

describe("DevLog API Test Suite", () => {
  let server;
  let baseUrl;
  let createdServiceId;
  let createdIncidentId;
  const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  before(async () => {
    // Start an HTTP server on a random available port (port 0)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });
  });

  after(async () => {
    // Gracefully shut down the test server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Health check
  it("GET /health - returns 200 with database status up", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.status, "ok");
    assert.equal(data.database, "up");
  });

  // 2. List services
  it("GET /services - lists all services ordered by name", async () => {
    const res = await fetch(`${baseUrl}/services`);
    const services = await res.json();

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(services));
    assert.ok(services.length >= 3, "Expected at least the 3 seed services to exist");

    // Check alphabetical ordering
    for (let i = 0; i < services.length - 1; i++) {
      assert.ok(
        services[i].name.localeCompare(services[i + 1].name) <= 0,
        "Services should be sorted alphabetically by name"
      );
    }
  });

  // 3. Create service
  it("POST /services - creates a new service and returns 201", async () => {
    const newServicePayload = {
      name: `Test Service ${uniqueSuffix}`,
      environment: "PRODUCTION",
    };

    const res = await fetch(`${baseUrl}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newServicePayload),
    });
    const created = await res.json();

    assert.equal(res.status, 201);
    assert.equal(created.name, newServicePayload.name);
    assert.equal(created.environment, "PRODUCTION");
    assert.ok(created.id > 0);

    createdServiceId = created.id;
  });

  // 4. Duplicate service -> 409 Conflict
  it("POST /services - returns 409 Conflict when name and environment are duplicated", async () => {
    const duplicatePayload = {
      name: `Test Service ${uniqueSuffix}`,
      environment: "PRODUCTION",
    };

    const res = await fetch(`${baseUrl}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatePayload),
    });
    const errorData = await res.json();

    assert.equal(res.status, 409);
    assert.equal(errorData.error.code, "CONFLICT");
    assert.ok(errorData.error.message.includes("already exists"));
  });

  // 5. Create incident
  it("POST /incidents - creates a new incident with status OPEN and returns 201", async () => {
    const newIncidentPayload = {
      serviceId: createdServiceId,
      title: `Memory spike incident ${uniqueSuffix}`,
      description: "Service memory utilization spiked above 95% threshold.",
      severity: "CRITICAL",
    };

    const res = await fetch(`${baseUrl}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIncidentPayload),
    });
    const created = await res.json();

    assert.equal(res.status, 201);
    assert.equal(created.title, newIncidentPayload.title);
    assert.equal(created.severity, "CRITICAL");
    assert.equal(created.status, "OPEN");
    assert.ok(created.service);
    assert.equal(created.service.id, createdServiceId);

    createdIncidentId = created.id;
  });

  // 6. Validation error -> 400 Bad Request
  it("POST /incidents - returns 400 Bad Request with all validation problems listed", async () => {
    const invalidPayload = {
      serviceId: -1,
      title: "   ",
      description: "",
      severity: "INVALID_SEVERITY",
    };

    const res = await fetch(`${baseUrl}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });
    const errorData = await res.json();

    assert.equal(res.status, 400);
    assert.equal(errorData.error.code, "BAD_REQUEST");
    assert.ok(Array.isArray(errorData.error.details));
    assert.equal(errorData.error.details.length, 4, "Should list all 4 invalid fields");
  });

  // 7. Resolve success -> 201 Created
  it("POST /incidents/:id/resolve - successfully resolves an incident and creates post-mortem", async () => {
    const resolvePayload = {
      rootCause: "Unbounded in-memory LRU cache grew indefinitely without eviction.",
      resolutionSteps: "Implemented max-size limit and configured Redis as external cache.",
      timeSpentMinutes: 60,
    };

    const res = await fetch(`${baseUrl}/incidents/${createdIncidentId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolvePayload),
    });
    const resolved = await res.json();

    assert.equal(res.status, 201);
    assert.equal(resolved.status, "RESOLVED");
    assert.ok(resolved.postMortem);
    assert.equal(resolved.postMortem.incidentId, createdIncidentId);
    assert.equal(resolved.postMortem.timeSpentMinutes, 60);
    assert.equal(resolved.postMortem.rootCause, resolvePayload.rootCause);
  });

  // 8. Resolve twice -> 409 Conflict
  it("POST /incidents/:id/resolve - returns 409 Conflict if incident is already resolved", async () => {
    const resolveAgainPayload = {
      rootCause: "Duplicate attempt",
      resolutionSteps: "Should be rejected",
      timeSpentMinutes: 15,
    };

    const res = await fetch(`${baseUrl}/incidents/${createdIncidentId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolveAgainPayload),
    });
    const errorData = await res.json();

    assert.equal(res.status, 409);
    assert.equal(errorData.error.code, "CONFLICT");
    assert.ok(errorData.error.message.includes("already resolved"));
  });

  // 9. Resolve unknown id -> 404 Not Found
  it("POST /incidents/:id/resolve - returns 404 Not Found if incident does not exist", async () => {
    const unknownId = 9999999;
    const res = await fetch(`${baseUrl}/incidents/${unknownId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rootCause: "Non-existent",
        resolutionSteps: "Non-existent",
        timeSpentMinutes: 20,
      }),
    });
    const errorData = await res.json();

    assert.equal(res.status, 404);
    assert.equal(errorData.error.code, "NOT_FOUND");
    assert.ok(errorData.error.message.includes("not found"));
  });

  // 10. Status filter
  it("GET /incidents - filters incidents by status accurately", async () => {
    // Check OPEN filter
    const openRes = await fetch(`${baseUrl}/incidents?status=OPEN`);
    const openData = await openRes.json();
    assert.equal(openRes.status, 200);
    assert.ok(openData.data.every((inc) => inc.status === "OPEN"));

    // Check RESOLVED filter
    const resolvedRes = await fetch(`${baseUrl}/incidents?status=RESOLVED`);
    const resolvedData = await resolvedRes.json();
    assert.equal(resolvedRes.status, 200);
    assert.ok(resolvedData.data.every((inc) => inc.status === "RESOLVED"));
    assert.ok(resolvedData.data.length >= 2, "Expected seed resolved incident and newly resolved incident");
  });

  // 11. Pagination
  it("GET /incidents - paginates results with skip, take, and pagination envelope", async () => {
    const limit = 2;
    const res = await fetch(`${baseUrl}/incidents?page=1&limit=${limit}`);
    const pageData = await res.json();

    assert.equal(res.status, 200);
    assert.equal(pageData.page, 1);
    assert.equal(pageData.limit, limit);
    assert.equal(pageData.data.length, limit);
    assert.ok(pageData.total >= 4, "Total should be at least seed incidents + newly created incident");
    assert.equal(pageData.totalPages, Math.ceil(pageData.total / limit));
  });

  // 12. Stats
  it("GET /stats - returns open incidents count, high severity count, and total minutes", async () => {
    const res = await fetch(`${baseUrl}/stats`);
    const stats = await res.json();

    assert.equal(res.status, 200);
    assert.equal(typeof stats.openIncidents, "number");
    assert.equal(typeof stats.openHighSeverity, "number");
    assert.equal(typeof stats.totalMinutesSpent, "number");

    // Total minutes spent should include at least seed (90) + our resolved test incident (60) = 150
    assert.ok(
      stats.totalMinutesSpent >= 150,
      `Expected totalMinutesSpent >= 150, received ${stats.totalMinutesSpent}`
    );
  });
});
