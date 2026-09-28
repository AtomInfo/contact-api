# Contact API V1 — Endpoint Status

> Base URL: `/api/v1`

## Implemented endpoints

### 1. Health & System

* [x] `GET /health` — Check API health/status
* [x] `GET /version` — Get API version information

### 2. Contact Messages

#### Public Contact Submission

* [x] `POST /contacts` — Submit a new contact message

  * [x] Validate `firstName`
  * [x] Validate `lastName`
  * [x] Validate `email`
  * [x] Validate optional `phone`
  * [x] Validate `message`
  * [x] Accept optional `metadata`
  * [x] Set status to `NEW`
  * [x] Store submission in PostgreSQL (using Prisma)
  * [x] Apply rate limiting (prevent duplicate within 60s)

---

## Next up / still to build

### Contact Management

* [x] `GET /contacts` — List contact messages

  * [x] Pagination (response: `{ data, total, page, limit }`, max `limit` 100)
  * [x] Filter by `applicationId`
  * [x] Filter by `status`
  * [x] Filter by `email`
  * [x] Search by name/email/message
  * [x] Sort by creation date / updated date / status / email / applicationId

* [x] `GET /contacts/:id` — Get a single contact message (404 if missing)

* [x] `PATCH /contacts/:id` — Update a contact message

  * [x] Update status
  * [x] Update contact information where appropriate
  * [x] Update metadata where appropriate

* [x] `DELETE /contacts/:id` — Delete a contact message (404 if missing)

---

## 3. Contact Status

Supported statuses:

```text
NEW
READ
IN_PROGRESS
RESOLVED
SPAM
```

* [x] Validate status transitions through service payload validation
* [x] Prevent invalid status values
* [ ] Add endpoint for status-only updates if needed:

  * [ ] `PATCH /contacts/:id/status`

> Status changes are currently handled through `PATCH /contacts/:id` and validated at the service boundary.
> A dedicated status endpoint can be added later if the workflow requires it.

---

## 4. Application Authentication

Applications should authenticate when submitting contact messages.

* [ ] Implement API key authentication
* [ ] Validate API key
* [ ] Resolve `applicationId` from the API key
* [ ] Reject inactive/invalid applications
* [ ] Prevent clients from manually setting `applicationId`
* [ ] Add API key rotation support

### Reintroduce `APP_API_KEYS`

* [ ] Re-add `APP_API_KEYS` environment-based app secret lookup for contact submission
* [ ] Document required env format: `{ "app-id": "secret-key" }`
* [ ] Validate the submitted `applicationId` matches the configured app secret
* [ ] Add a test for missing/mismatched API keys when the feature is reintroduced

> This feature is intentionally deferred for now and should be reintroduced as a dedicated auth enhancement after the current CRUD/API work is stabilized.

### Authentication Flow

```text
Client Application
       │
       │ API Key
       ▼
Contact API
       │
       ├── Validate API Key
       │
       ├── Resolve Application
       │
       └── Create ContactMessage
```

---

## 5. Admin Authentication

Admin authentication is required for contact management endpoints.

* [x] `POST /auth/login` — Admin login (returns `{ accessToken, refreshToken, tokenType, expiresIn }`)
* [x] `POST /auth/refresh` — Refresh access token (body `{ refreshToken }`; rotates the refresh token)
* [x] `POST /auth/logout` — Logout (body `{ refreshToken }`; revokes it, returns 204)
* [x] `GET /auth/me` — Get authenticated admin

Protected with `Authorization: Bearer <accessToken>` (`AdminAuthGuard`):

```text
GET    /contacts
GET    /contacts/:id
PATCH  /contacts/:id
DELETE /contacts/:id
```

`POST /contacts` stays public.

### How it works

* Access tokens: HS256 JWTs, 15 minutes by default. Every request re-checks that the admin still exists and is active.
* Refresh tokens: opaque random strings, stored only as SHA-256 hashes in `AdminRefreshToken`. Each refresh revokes the old token. Replaying a revoked token revokes all of that admin's sessions.
* Passwords: bcrypt with cost 12. Unknown emails still run a bcrypt comparison so they can't be detected by timing.

### Environment

| Variable | Required | Default |
| --- | --- | --- |
| `ADMIN_JWT_SECRET` | yes, at least 32 characters (the app won't start without it) | none |
| `ADMIN_ACCESS_TOKEN_TTL_SECONDS` | no | `900` |
| `ADMIN_REFRESH_TOKEN_TTL_DAYS` | no | `7` |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

### Creating an admin

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='at-least-12-chars' ADMIN_NAME='You' pnpm admin:create
```

Running it for an existing email resets the password and reactivates the account.

### Follow-ups

* [ ] Rate-limit `POST /auth/login` (needs `trust proxy` configured for Vercel first, so limits apply per client IP)
* [ ] Periodically delete expired and revoked refresh tokens

---

## 6. Contact Notifications

### Internal Notification

* [ ] Send email notification when a new contact is received
* [ ] Configure recipient email per application
* [ ] Include contact details in notification
* [ ] Include application name
* [ ] Include metadata where appropriate

### Customer Notification

* [ ] Optional acknowledgement email to the person submitting the form
* [ ] Create configurable email template
* [ ] Prevent notification failures from breaking contact submission

---

## 7. Security & Reliability

* [x] Enable global request validation
* [ ] Configure rate limiting
* [ ] Add request size limits
* [ ] Sanitize/validate metadata
* [x] Protect admin endpoints
* [ ] Secure API keys
* [ ] Never store API keys in plain text
* [ ] Add structured application logging
* [ ] Add error handling
* [ ] Add CORS configuration
* [ ] Configure environment variables
* [ ] Add production security headers

---

## 8. API Documentation

* [ ] Configure Swagger/OpenAPI
* [ ] Document all endpoints
* [ ] Document request DTOs
* [ ] Document response DTOs
* [ ] Document authentication
* [ ] Document error responses
* [ ] Document contact statuses
* [ ] Document metadata usage

Swagger endpoint:

```text
/api/docs
```

---

## 9. Testing

### Contacts

* [ ] Test successful contact submission
* [ ] Test invalid email
* [ ] Test missing required fields
* [ ] Test optional phone
* [ ] Test metadata
* [ ] Test invalid metadata
* [ ] Test default `NEW` status
* [x] Test retrieving contacts
* [x] Test filtering
* [x] Test pagination
* [x] Test updating status
* [x] Test deleting contact

### Authentication

* [ ] Test valid API key
* [ ] Test invalid API key
* [ ] Test inactive application
* [ ] Test missing API key
* [x] Test admin authentication
* [x] Test protected endpoints

### Security

* [ ] Test rate limiting
* [ ] Test oversized requests
* [x] Test unauthorized access
* [x] Test malformed requests

---

## 10. Future Enhancements

These are intentionally **not part of V1**:

* [ ] Contact assignment
* [ ] Contact conversations
* [ ] Contact notes
* [ ] Attachments
* [ ] WhatsApp notifications
* [ ] SMS notifications
* [ ] Webhooks
* [ ] Analytics/dashboard
* [ ] Advanced search
* [ ] Soft deletion
* [ ] Audit history
* [ ] Multiple admin roles
* [ ] Application management dashboard

---

## V1 Priority

### Must Have

* [ ] Health endpoint
* [ ] Contact submission
* [ ] Contact validation
* [ ] `metadata` support
* [ ] Application identification
* [ ] API key authentication
* [ ] Contact listing
* [ ] Contact retrieval
* [ ] Contact status updates
* [ ] Pagination
* [ ] Filtering
* [ ] Rate limiting
* [ ] Swagger documentation
* [ ] Tests

### Should Have

* [x] Admin authentication
* [ ] Email notifications
* [ ] API key rotation
* [ ] Structured logging

### Later

* [ ] Admin dashboard
* [ ] Contact assignment
* [ ] Conversations
* [ ] Webhooks
* [ ] WhatsApp/SMS
* [ ] Analytics
