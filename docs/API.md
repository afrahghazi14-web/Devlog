# DevLog API Documentation (v1)

DevLog provides a RESTful API versioned under `/api/v1`. All requests and responses use JSON.

- **Base URL**: `http://localhost:4000/api/v1`
- **Default Port**: `4000`
- **Payload Limit**: `100kb`
- **Rate Limit**: Generous `300 requests per 15 minutes` window per IP (enforced on `/api/*`).

---

## Standard Error Format

All error responses return a standardized JSON envelope with appropriate HTTP status codes:

```json
{
  "error": {
    "message": "Human-readable explanation of what went wrong.",
    "code": "ERROR_CODE",
    "details": ["Optional list of specific field validation problems"]
  }
}
```

### Common HTTP Status Codes
| Status Code | Code String | Meaning |
|---|---|---|
| `200 OK` | — | Request succeeded |
| `201 Created` | — | Resource successfully created |
| `400 Bad Request` | `BAD_REQUEST` | Validation failed or malformed JSON |
| `404 Not Found` | `NOT_FOUND` | Resource or route does not exist |
| `409 Conflict` | `CONFLICT` | Unique constraint violation or state conflict |
| `413 Payload Too Large` | `PAYLOAD_TOO_LARGE` | Request payload exceeds 100kb limit |
| `429 Too Many Requests` | `TOO_MANY_REQUESTS` | Rate limit threshold exceeded |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled error on server (stack traces masked) |

---

## 1. Health Check

### `GET /health`
Verifies server operation and checks PostgreSQL connectivity by running a lightweight query.

- **Request Query**: None
- **Request Body**: None

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "database": "up"
}
```

#### Error Response (`503 Service Unavailable`)
```json
{
  "status": "error",
  "database": "down"
}
```

---

## 2. Services

### `GET /services`
Lists all registered services, ordered alphabetically by name (`name ASC`).

- **Request Query**: None
- **Request Body**: None

#### Success Response (`200 OK`)
```json
[
  {
    "id": 2,
    "name": "Billing Engine",
    "environment": "PRODUCTION",
    "createdAt": "2026-10-23T11:00:00.000Z"
  },
  {
    "id": 3,
    "name": "Notification API",
    "environment": "STAGING",
    "createdAt": "2026-10-23T11:00:00.000Z"
  },
  {
    "id": 1,
    "name": "User Auth",
    "environment": "PRODUCTION",
    "createdAt": "2026-10-23T11:00:00.000Z"
  }
]
```

---

### `POST /services`
Registers a new service within an environment. `(name, environment)` must be unique together.

- **Request Body**:
  - `name` *(string, required)*: Max 100 characters.
  - `environment` *(string, required)*: Allowed values: `"PRODUCTION"`, `"STAGING"`, `"QA"`.

#### Example Request
```http
POST /api/v1/services HTTP/1.1
Content-Type: application/json

{
  "name": "Payment Gateway",
  "environment": "PRODUCTION"
}
```

#### Success Response (`201 Created`)
```json
{
  "id": 4,
  "name": "Payment Gateway",
  "environment": "PRODUCTION",
  "createdAt": "2026-10-23T11:05:00.000Z"
}
```

#### Error Responses
- **Validation Failure (`400 Bad Request`)**:
  ```json
  {
    "error": {
      "message": "Service name is required and cannot be empty.; Environment is required and must be one of: PRODUCTION, STAGING, QA.",
      "code": "BAD_REQUEST",
      "details": [
        "Service name is required and cannot be empty.",
        "Environment is required and must be one of: PRODUCTION, STAGING, QA."
      ]
    }
  }
  ```
- **Duplicate Service (`409 Conflict`)**:
  ```json
  {
    "error": {
      "message": "Service 'Payment Gateway' already exists in the 'PRODUCTION' environment.",
      "code": "CONFLICT"
    }
  }
  ```

---

## 3. Incidents

### `GET /incidents`
Fetches a paginated list of incidents sorted newest first (`createdAt DESC`), with its associated service included. Avoids N+1 query overhead.

- **Query Parameters**:
  - `status` *(string, optional, default: `"ALL"`)*: `"ALL"`, `"OPEN"`, `"RESOLVED"`.
  - `page` *(integer, optional, default: `1`)*: Page number (>= 1).
  - `limit` *(integer, optional, default: `10`)*: Records per page (1 to 50).

#### Example Request
```http
GET /api/v1/incidents?status=OPEN&page=1&limit=2 HTTP/1.1
```

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": 2,
      "title": "Push notification delivery queue delay",
      "description": "Background worker queue backing up during marketing broadcast delivery.",
      "severity": "MEDIUM",
      "status": "OPEN",
      "createdAt": "2026-10-23T11:00:00.000Z",
      "serviceId": 3,
      "service": {
        "id": 3,
        "name": "Notification API",
        "environment": "STAGING",
        "createdAt": "2026-10-23T11:00:00.000Z"
      }
    },
    {
      "id": 1,
      "title": "High latency on user authentication token verification",
      "description": "Auth token verification requests taking over 3 seconds under peak load.",
      "severity": "CRITICAL",
      "status": "OPEN",
      "createdAt": "2026-10-23T11:00:00.000Z",
      "serviceId": 1,
      "service": {
        "id": 1,
        "name": "User Auth",
        "environment": "PRODUCTION",
        "createdAt": "2026-10-23T11:00:00.000Z"
      }
    }
  ],
  "page": 1,
  "limit": 2,
  "total": 2,
  "totalPages": 1
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "error": {
    "message": "Invalid status 'PENDING'. Allowed values: ALL, OPEN, RESOLVED.",
    "code": "BAD_REQUEST",
    "details": [
      "Invalid status 'PENDING'. Allowed values: ALL, OPEN, RESOLVED."
    ]
  }
}
```

---

### `GET /incidents/:id`
Retrieves a single incident by ID, including its associated service and optional post-mortem.

- **Path Parameters**:
  - `id` *(integer, required)*: Incident primary key ID.

#### Example Request
```http
GET /api/v1/incidents/3 HTTP/1.1
```

#### Success Response (`200 OK`)
```json
{
  "id": 3,
  "title": "Invoice PDF generation timeout",
  "description": "Monthly billing cycle invoice generation job timed out due to memory limits.",
  "severity": "HIGH",
  "status": "RESOLVED",
  "createdAt": "2026-10-23T11:00:00.000Z",
  "serviceId": 2,
  "service": {
    "id": 2,
    "name": "Billing Engine",
    "environment": "PRODUCTION",
    "createdAt": "2026-10-23T11:00:00.000Z"
  },
  "postMortem": {
    "id": 1,
    "rootCause": "Chromium headless process memory leak during parallel batch rendering of PDF invoices.",
    "resolutionSteps": "Allocated 4GB container memory limit and pooled Chromium browser instances with automatic worker recycling.",
    "timeSpentMinutes": 90,
    "createdAt": "2026-10-23T11:00:00.000Z",
    "incidentId": 3
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "error": {
    "message": "Incident not found with id 999999.",
    "code": "NOT_FOUND"
  }
}
```

---

### `POST /incidents`
Logs a new incident against an existing service. The incident starts in status `OPEN`.

- **Request Body**:
  - `serviceId` *(integer, required)*: ID of the existing Service.
  - `title` *(string, required)*: Max 200 characters.
  - `description` *(string, required)*: Max 2000 characters.
  - `severity` *(string, required)*: `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`.

#### Example Request
```http
POST /api/v1/incidents HTTP/1.1
Content-Type: application/json

{
  "serviceId": 1,
  "title": "Intermittent token signature rejection",
  "description": "Key rotation timing jitter causing auth failures for 2% of users.",
  "severity": "HIGH"
}
```

#### Success Response (`201 Created`)
```json
{
  "id": 4,
  "title": "Intermittent token signature rejection",
  "description": "Key rotation timing jitter causing auth failures for 2% of users.",
  "severity": "HIGH",
  "status": "OPEN",
  "createdAt": "2026-10-23T11:10:00.000Z",
  "serviceId": 1,
  "service": {
    "id": 1,
    "name": "User Auth",
    "environment": "PRODUCTION",
    "createdAt": "2026-10-23T11:00:00.000Z"
  }
}
```

#### Error Responses
- **Referenced Service Not Found (`404 Not Found`)**:
  ```json
  {
    "error": {
      "message": "Service not found with id 99999.",
      "code": "NOT_FOUND"
    }
  }
  ```
- **Validation Failure (`400 Bad Request`)**:
  ```json
  {
    "error": {
      "message": "Incident title is required and cannot be empty.; Severity is required and must be one of: LOW, MEDIUM, HIGH, CRITICAL.",
      "code": "BAD_REQUEST",
      "details": [
        "Incident title is required and cannot be empty.",
        "Severity is required and must be one of: LOW, MEDIUM, HIGH, CRITICAL."
      ]
    }
  }
  ```

---

### `POST /incidents/:id/resolve`
Resolves an OPEN incident and creates its post-mortem in a single database transaction (`prisma.$transaction`).
Guarantees race-condition protection via atomic conditional update (`updateMany with status = 'OPEN'`).

- **Path Parameters**:
  - `id` *(integer, required)*: ID of the incident to resolve.
- **Request Body**:
  - `rootCause` *(string, required)*: Root cause explanation (max 2000 characters).
  - `resolutionSteps` *(string, required)*: Actions taken to fix the issue (max 2000 characters).
  - `timeSpentMinutes` *(integer, required)*: Total resolution time in minutes (> 0).

#### Example Request
```http
POST /api/v1/incidents/4/resolve HTTP/1.1
Content-Type: application/json

{
  "rootCause": "Race condition in JWKS key cache during rotation interval.",
  "resolutionSteps": "Synchronized cache refresh window with 10-minute key overlap.",
  "timeSpentMinutes": 55
}
```

#### Success Response (`201 Created`)
```json
{
  "id": 4,
  "title": "Intermittent token signature rejection",
  "description": "Key rotation timing jitter causing auth failures for 2% of users.",
  "severity": "HIGH",
  "status": "RESOLVED",
  "createdAt": "2026-10-23T11:10:00.000Z",
  "serviceId": 1,
  "service": {
    "id": 1,
    "name": "User Auth",
    "environment": "PRODUCTION",
    "createdAt": "2026-10-23T11:00:00.000Z"
  },
  "postMortem": {
    "id": 2,
    "rootCause": "Race condition in JWKS key cache during rotation interval.",
    "resolutionSteps": "Synchronized cache refresh window with 10-minute key overlap.",
    "timeSpentMinutes": 55,
    "createdAt": "2026-10-23T11:15:00.000Z",
    "incidentId": 4
  }
}
```

#### Error Responses
- **Incident Already Resolved (`409 Conflict`)**:
  ```json
  {
    "error": {
      "message": "Incident with id 4 is already resolved.",
      "code": "CONFLICT"
    }
  }
  ```
- **Incident Does Not Exist (`404 Not Found`)**:
  ```json
  {
    "error": {
      "message": "Incident not found with id 999999.",
      "code": "NOT_FOUND"
    }
  }
  ```
- **Validation Failure (`400 Bad Request`)**:
  ```json
  {
    "error": {
      "message": "timeSpentMinutes must be a positive integer.",
      "code": "BAD_REQUEST",
      "details": [
        "timeSpentMinutes must be a positive integer."
      ]
    }
  }
  ```

---

## 4. Dashboard Stats

### `GET /stats`
Aggregates real-time incident metrics for dashboard summary cards.

- **Request Query**: None
- **Request Body**: None

#### Success Response (`200 OK`)
```json
{
  "openIncidents": 2,
  "openHighSeverity": 1,
  "totalMinutesSpent": 90
}
```

- `openIncidents`: Count of incidents with `status = 'OPEN'`.
- `openHighSeverity`: Count of OPEN incidents where severity is `"HIGH"` or `"CRITICAL"`.
- `totalMinutesSpent`: Sum of `timeSpentMinutes` across all `PostMortem` records (returns `0` if none exist).

---

## 5. Security & Hardening Features

- **Helmet**: Sets secure response headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options`, and `Strict-Transport-Security`.
- **Rate Limiting**: Throttles IP clients to 300 requests per 15-minute window with standard `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` response headers.
- **Payload Clamping**: Body parser caps requests at `100kb`. Payloads exceeding this limit return HTTP `413 Payload Too Large`.
- **CORS Protection**: Restricted to the frontend origin declared in the `FRONTEND_URL` environment variable.
