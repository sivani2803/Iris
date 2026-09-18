# IRIS API Reference Specification

Base URL: `http://localhost:5000/api`  
Real-time Socket.IO: `ws://localhost:5000`

---

## Headers & Conventions

All responses follow standard JSON envelopes:
```json
{
  "success": true,
  "data": { ... }
}
```
In case of errors:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

- `X-Request-Id`: Unique UUID returned in response headers for distributed request tracing.
- `Authorization`: `Bearer <jwt_token>` for authenticated endpoints.

---

## 1. System Observability & Probes

### `GET /health`
Liveness probe.
```json
{
  "status": "online",
  "service": "IRIS Senior-Care Backend",
  "timestamp": "2026-09-18T05:00:00.000Z"
}
```

### `GET /ready`
Readiness probe reporting database connectivity.
- Response Status: `200 OK` (when DB connected) or `503 Service Unavailable`
```json
{
  "status": "ready",
  "service": "IRIS Senior-Care Backend",
  "database": "connected",
  "uptimeSeconds": 142,
  "timestamp": "2026-09-18T05:00:00.000Z"
}
```

---

## 2. Authentication & RBAC

### `POST /auth/login`
Authenticates a user and issues a JWT token.
- **Request Body**:
```json
{
  "email": "family@iris.care",
  "password": "Password123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "60a...",
    "name": "Rohan Sharma",
    "email": "family@iris.care",
    "role": "family",
    "seniorId": "S102"
  }
}
```

### `GET /auth/me`
Retrieves the profile of the current authenticated user.
- **Headers**: `Authorization: Bearer <token>`

### `GET /auth/admin/audit-logs`
Administrative audit logs (Protected: `admin` role required).

---

## 3. Emergency & Telemetry Pipeline

### `POST /emergency/health-event`
Ingests health telemetry from smartwatch hardware or simulator.
- **Request Body**:
```json
{
  "seniorId": "S102",
  "eventId": "EVT-WATCH-1789708502",
  "deviceId": "DEV-WATCH-S102",
  "heartRate": 145,
  "spo2": 91,
  "motionState": "stationary",
  "fallDetected": true,
  "eventType": "fall",
  "timestamp": "2026-09-18T05:00:00.000Z"
}
```
- **Idempotency**: If `eventId` was already processed, returns the cached result without generating duplicate emergencies.

### `GET /emergency/active`
Retrieves currently active emergency for senior (query: `?seniorId=S102`).

### `POST /emergency/:id/accept`
Caretaker accepts dispatch (transitions to `acknowledged`).

### `POST /emergency/:id/decline`
Caretaker declines dispatch (transitions to `reassessing`).
- **Request Body**:
```json
{
  "reason": "Traffic blockage on Madhapur approach"
}
```
*Note: A non-empty reason is strictly required.*

### `POST /emergency/:id/en-route`
Caretaker marks transit begun (transitions to `en_route`).

### `POST /emergency/:id/arrived`
Caretaker arrives on scene (transitions to `arrived`, sets ETA = 0).

### `POST /emergency/:id/resolve`
Closes the emergency loop (transitions to `resolved`, active = false).
- **Request Body**:
```json
{
  "resolutionNotes": "Senior assisted safely. Vitals normalized."
}
```

### `POST /emergency/reset`
Resets active emergencies for clean demonstration sessions.

---

## 4. AI Care Assistant

### `POST /ai/chat`
Multilingual, non-diagnostic empathetic symptom guide.
- **Request Body**:
```json
{
  "message": "నాకు తల తిరుగుతున్నట్టు ఉంది",
  "language": "te",
  "seniorId": "S102"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "reply": "మీకు తల తిరుగుతున్నట్టు ఉంటే...",
    "urgency": "MODERATE",
    "suggestedActions": ["కూర్చోండి లేదా విశ్రాంతి తీసుకోండి"]
  }
}
```

### `POST /ai/triage`
Structured intent triage parsing.
- **Request Body**:
```json
{
  "text": "Sudden fall impact and severe chest pain",
  "language": "en"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "request_type": "emergency",
    "incident": "fall",
    "severity": "critical",
    "mobility_required": false,
    "medical_assistance": true,
    "response_required": "immediate"
  }
}
```

---

## 5. Real-Time Socket.IO Events

Connected clients can join room `senior_<seniorId>` via `join_senior_room`.

| Event Name | Direction | Payload |
|---|---|---|
| `telemetry_update` | Server &rarr; Client | Current vital telemetry packet |
| `health_alert` | Server &rarr; Client | Critical health threshold alert |
| `emergency_created` | Server &rarr; Client | Full emergency object on incident creation |
| `emergency_updated` | Server &rarr; Client | Full emergency object on status change |
| `emergency_resolved` | Server &rarr; Client | `{ emergencyId, seniorId }` |
