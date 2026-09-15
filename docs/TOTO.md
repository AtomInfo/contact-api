# Contact API V1 — Endpoint TODO

> Base URL: `/api/v1`

## 1. Health & System

* [ ] `GET /health` — Check API health/status
* [ ] `GET /version` — Get API version information

---

## 2. Contact Messages

### Public Contact Submission

* [x] `POST /contacts` — Submit a new contact message (implemented, in-memory storage)

  * [x] Validate `firstName`
  * [x] Validate `lastName`
  * [x] Validate `email`
  * [x] Validate optional `phone`
  * [x] Validate `message`
  * [x] Accept optional `metadata`
  * [x] Set status to `NEW`
  * [x] Store submission in PostgreSQL (using Prisma)
  * [x] Apply rate limiting (prevent duplicate within 60s)

### Contact Management

* [ ] `GET /contacts` — List contact messages

  * [ ] Pagination
  * [ ] Filter by `applicationId`
  * [ ] Filter by `status`
  * [ ] Filter by `email`
  * [ ] Search by name/email/message
  * [ ] Sort by creation date

* [ ] `GET /contacts/:id` — Get a single contact message

* [ ] `PATCH /contacts/:id` — Update a contact message

  * [ ] Update status
  * [ ] Update contact information where appropriate
  * [ ] Update metadata where appropriate

* [ ] `DELETE /contacts/:id` — Delete a contact message

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

* [ ] Validate status transitions
* [ ] Prevent invalid status values
* [ ] Add endpoint for status-only updates if needed:

  * [ ] `PATCH /contacts/:id/status`

> Initially, status changes can be handled through `PATCH /contacts/:id`.
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

* [ ] `POST /auth/login` — Admin login
* [ ] `POST /auth/refresh` — Refresh access token
* [ ] `POST /auth/logout` — Logout
* [ ] `GET /auth/me` — Get authenticated admin

Protect:

```text
GET    /contacts
GET    /contacts/:id
PATCH  /contacts/:id
DELETE /contacts/:id
```

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

* [ ] Enable global request validation
* [ ] Configure rate limiting
* [ ] Add request size limits
* [ ] Sanitize/validate metadata
* [ ] Protect admin endpoints
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
* [ ] Test retrieving contacts
* [ ] Test filtering
* [ ] Test pagination
* [ ] Test updating status
* [ ] Test deleting contact

### Authentication

* [ ] Test valid API key
* [ ] Test invalid API key
* [ ] Test inactive application
* [ ] Test missing API key
* [ ] Test admin authentication
* [ ] Test protected endpoints

### Security

* [ ] Test rate limiting
* [ ] Test oversized requests
* [ ] Test unauthorized access
* [ ] Test malformed requests

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

* [ ] Admin authentication
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
