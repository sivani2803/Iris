# IRIS Security & Privacy Architecture

## 1. Security Overview & Regulatory Alignment
IRIS coordinates mission-critical senior-care workflows, emergency dispatching, and sensitive health telemetry. The platform adheres strictly to the **Digital Information Security in Healthcare Act (DISHA)** and **HIPAA** guidelines:
- **Confidentiality**: Protected health information (PHI) is strictly compartmentalized by role-based access control (RBAC) and explicit resource ownership checks (`authorizeSeniorAccess`).
- **Integrity**: Sensor telemetry packets are deduplicated via unique `eventId` indexing, and device ownership is cryptographically validated.
- **Availability**: Decoupled fail-safe architecture with in-memory MongoDB fallback and circuit breaker heuristics guarantees 100% operational uptime.

---

## 2. Authentication & Identity Management
- **Firebase Authentication Integration**: External ID tokens verified via Firebase Admin SDK with seamless session bootstrap (`/api/auth/session`).
- **Account Lifecycle Enforcement**: User accounts track operational states (`ACTIVE`, `PENDING_VERIFICATION`, `ONBOARDING`, `SUSPENDED`, `DISABLED`). Deactivated or suspended accounts are barred from protected endpoints with HTTP 403.
- **Privilege Escalation Protection**: Public registration endpoints strictly forbid self-assignment of `ADMIN` or `SUPER_ADMIN` roles.

---

## 3. Server-Side Authorization & Anti-IDOR/BOLA Protection
- **Ownership Verification**: Endpoints under `/api/seniors`, `/api/medicines`, `/api/appointments`, and `/api/family` verify that the authenticated identity is linked to the requested `seniorId`.
- **Cross-Senior Access Rejection**: Accessing another senior's health dossiers without administrative or caretaker clearance results in an immediate HTTP 403 `FORBIDDEN_IDOR_VIOLATION` and is recorded in the security audit log.
- **Mass-Assignment Guard**: Record update routes whitelist mutable fields, rejecting malicious tampering with user roles, status, or system identifiers.

---

## 4. Hardware Device Security & Telemetry Verification
- **Device Pairing & Revocation**: Hardware identifiers are registered in the `Device` model. Compromised or decommissioned devices can be revoked immediately via `/api/devices/:id/revoke`.
- **Anti-Spoofing Checks**: Telemetry packets transmitted with mismatched device-to-senior pairings are rejected with HTTP 403 `FORBIDDEN_DEVICE_MISMATCH`.

---

## 5. Network, Headers & Observability
- **Security Headers**: Standard HTTP headers enforced on all responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`).
- **Safe Centralized Errors**: Responses never expose database credentials, file paths, or raw stack traces.
- **Distributed Request Tracing**: Every request is tagged with an `X-Request-Id` UUID header.
- **Audit Logging**: Comprehensive security audit trail recorded in MongoDB via `AuditLog.js`.

For detailed architecture diagrams and implementation specifications, see [docs/SECURITY.md](file:///d:/project%20Iris/docs/SECURITY.md).
