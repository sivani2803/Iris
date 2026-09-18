# IRIS — Production Security, Authentication & Identity Hardening Reference

## 1. Authentication Architecture

IRIS enforces a multi-layered identity verification architecture where **Firebase Authentication** serves as the primary external authentication provider, while the IRIS database acts as the single source of truth for authorization, roles, account lifecycle states, and senior-care network relationships.

```
Firebase Authentication / Client Credentials
                 ↓
      Verified Identity Token
                 ↓
Backend Authentication Middleware (authenticateToken)
                 ↓
     Account Lifecycle Check (ACTIVE / SUSPENDED / DISABLED)
                 ↓
  Database User Lookup & Idempotent Bootstrap (/api/auth/session)
                 ↓
      Role & Resource Authorization (authorizeSeniorAccess)
                 ↓
     Authorized IRIS Session Context
```

### Identity Bootstrap & Token Verification
- **Dual-Mode Verification**: Validates both Google Firebase ID tokens (via Firebase Admin SDK) and HMAC-SHA256 JWT tokens.
- **Idempotent User Provisioning**: The `/api/auth/session` endpoint verifies token signatures, matches `firebaseUid` or email, and safely provisions the user without race conditions or duplicate records.
- **Credential Storage**: Passwords are encrypted using `bcryptjs` (salt rounds = 10) and are never logged or returned in responses.

---

## 2. Account Lifecycle States

Every user profile (`backend/models/User.js`) enforces strict account lifecycle states:

| State | Definition | Access Policy |
|---|---|---|
| `ACTIVE` | Account verified and operating normally | Full access to permitted role resources |
| `PENDING_VERIFICATION` | Email verification required | Limited onboarding access |
| `ONBOARDING` | Profile or consent setup incomplete | Redirect to profile completion |
| `SUSPENDED` | Temporarily locked due to security anomalies | HTTP 403 `FORBIDDEN_ACCOUNT_SUSPENDED` |
| `DISABLED` | Permanently deactivated account | HTTP 403 `FORBIDDEN_ACCOUNT_SUSPENDED` |

---

## 3. Server-Side Authorization & Anti-IDOR/BOLA Guardrails

### Role Hierarchy & Matrix
- `SUPER_ADMIN` / `ADMIN`: Operational system oversight, audit log inspection, device provisioning.
- `CAREGIVER`: Assigned senior health dossiers, active emergency triage, response actions.
- `FAMILY_MEMBER`: Linked senior vitals, adherence timeline, visit check-ins, consented notifications.
- `SENIOR`: Own profile, own medication tracker, 1-tap SOS trigger, multilingual AI companion.

### Anti-IDOR/BOLA Policy (`authorizeSeniorAccess`)
Cross-senior data access is cryptographically blocked at the middleware layer. Any request targeting `/api/seniors/:id`, `/api/seniors/:id/health`, `/api/medicines/:seniorId`, or `/api/appointments/:seniorId` verifies that the requesting user owns or is assigned to that senior ID:
- An attempt by `family@iris.care` (linked to `S102`) to request `/api/seniors/S999/health` results in:
  `HTTP 403 Forbidden: {"error": "FORBIDDEN_IDOR_VIOLATION", "message": "Access denied: You are not authorized to view or manage another senior's health records."}`
- The violation is immediately logged in `AuditLog` under `SECURITY_VIOLATION`.

### Mass-Assignment Prevention
Endpoint updates (`PUT /api/seniors/:id`) use explicit field whitelists:
- Allowed: `name`, `age`, `gender`, `bloodGroup`, `phone`, `address`, `medicalConditions`, `allergies`, `emergencyContacts`, `baselineVitals`.
- Blocked & Stripped: `_id`, `seniorId`, `role`, `status`, `createdAt`, `updatedAt`.

---

## 4. Consent Management Model (`Consent.js`)

In accordance with DISHA and HIPAA compliance, granular consent purposes are stored in the `Consent` model:

- `WEARABLE_DATA`: Continuous telemetry transmission from smartwatches.
- `HEALTH_DATA_SHARING`: Transmission of vitals to family dashboards.
- `FAMILY_ACCESS`: Family video check-ins and notifications.
- `CAREGIVER_ACCESS`: First-responder dispatch dossier disclosure.
- `LOCATION_SHARING`: Geofencing and GPS ambulance routing.
- `AI_PROCESSING`: Multilingual symptom triage with AI.
- `NOTIFICATIONS`: SMS/Push alert delivery.
- `VOICE_PROCESSING`: Audio speech-to-text processing.

---

## 5. Device Authentication & Revocation

Smartwatch hardware devices (`backend/models/Device.js`) are paired via hardware identifiers:
- Telemetry requests (`/api/emergency/health-event`) verify device registration.
- **Revocation Enforcement**: Revoked devices (`status: 'revoked'`) are instantly blocked with `HTTP 403 FORBIDDEN_REVOKED_DEVICE`.
- **Anti-Spoofing Check**: Telemetry claiming `seniorId = 'S999'` sent from a watch paired with `'S102'` is rejected with `HTTP 403 FORBIDDEN_DEVICE_MISMATCH`.

---

## 6. Socket.IO & Real-Time Channel Security

- **Handshake Verification**: Socket connections verify tokens on handshake.
- **Room Authorization**: Subscription requests (`socket.emit('join_senior_room', seniorId)`) verify that the user's role or `seniorId` matches the requested room before allowing the socket into `senior_${seniorId}`.

---

## 7. Rate Limiting & Abuse Prevention

Sliding-window in-memory rate limiters protect the perimeter:
- **Authentication**: 20 requests per minute (`authLimiter`).
- **Telemetry Ingestion**: 120 packets per minute per device (`telemetryLimiter`).
- **AI Queries**: 30 requests per minute (`aiLimiter`).
- **General APIs**: 300 requests per minute (`generalLimiter`).

---

## 8. Audit Logging Specification (`AuditLog.js`)

All security-sensitive operations are immutably written to MongoDB:
- `LOGIN`, `LOGOUT`
- `ACCOUNT_CREATED`
- `PROFILE_UPDATED`
- `ROLE_CHANGED`
- `CONSENT_GRANTED`, `CONSENT_REVOKED`
- `HEALTH_DATA_ACCESSED`
- `DEVICE_REGISTERED`, `DEVICE_REVOKED`
- `SECURITY_VIOLATION`
- `EMERGENCY_CREATED`, `EMERGENCY_ACKNOWLEDGED`, `EMERGENCY_EN_ROUTE`, `EMERGENCY_ARRIVED`, `EMERGENCY_RESOLVED`
- `CARETAKER_REASSIGNED`
- `ADMIN_ACTION`, `AI_INTERACTION`
