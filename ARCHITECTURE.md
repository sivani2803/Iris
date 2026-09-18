# IRIS System Architecture Document

## 1. System Overview

IRIS (Intelligent Response & Integrated Senior-care Network) implements a closed-loop healthcare coordination architecture. The database is the single source of truth; Socket.IO conveys real-time state changes to connected dashboards.

```
       [ Wear OS Smartwatch / Hardware Simulator ]
                           │
                           ▼ POST /api/emergency/health-event (with eventId, deviceId)
                 [ IRIS API Gateway ]
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[ Idempotency Cache ]                  [ Device Registry ]
(Duplicate check on eventId)          (Heartbeat & pairing update)
       │
       ▼
[ ML Risk Client / Heuristic Engine ]
       │
       ├─► NORMAL / WATCH ────► Broadcast Live Telemetry ────► Dashboards
       │
       └─► HIGH / CRITICAL ───► Create Emergency Record
                                      │
                                      ▼
                           [ Responder Matching Engine ]
                           (Calculates proximity, certs, workload)
                                      │
                                      ▼
                        [ Caretaker Dispatch Notification ]
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼ (Accept)                                    ▼ (Decline / Timeout)
       [ Responder En Route ]                   [ Autonomous Reassessment ]
               │                                             │
               ▼ (Arrived)                         ┌─────────┴─────────┐
       [ Direct Vitals Check ]                     ▼                   ▼
               │                          [ Alt Responder ]     [ EMS 108 Escalation ]
               ▼ (Resolve)
       [ Closed-Loop Resolution ]
```

---

## 2. Emergency State Machine

IRIS enforces a deterministic finite state machine (FSM). Any transition attempted outside the valid transition set is rejected with HTTP 400 Bad Request:

| Current State | Permitted Next States | Description |
|---|---|---|
| `detected` | `analyzing`, `assigned`, `reassessing`, `cancelled` | Incident sensor signature registered |
| `analyzing` | `assigned`, `reassessing`, `cancelled` | Risk attribution being evaluated |
| `assigned` | `acknowledged`, `reassessing`, `cancelled` | Certified responder alerted |
| `reassessing` | `assigned`, `en_route`, `cancelled` | Alternate responder or EMS 108 matching |
| `acknowledged` | `en_route`, `reassessing`, `cancelled` | Responder confirmed dispatch receipt |
| `en_route` | `arrived`, `cancelled` | Responder actively traveling to location |
| `arrived` | `resolved`, `cancelled` | Responder on scene, assessing senior |
| `resolved` | *None (Terminal)* | Emergency safely closed with notes |
| `cancelled` | *None (Terminal)* | Event cancelled by authorized supervisor |

---

## 3. High-Frequency Telemetry & Rendering

```
Watch Ingestion ──► Express API ──► Socket.IO 'telemetry_update'
                                           │
                                           ▼
                               [ Zustand Ring Buffer ]
                               (60 data points fixed capacity)
                                           │
                                           ▼
                               [ RAF Pulse Wave Canvas ]
                               (Canvas 2D @ 60 FPS, no React VDOM diffing)
```

To avoid re-rendering entire React component trees at high sensor sample rates (e.g. 5-10 Hz), incoming telemetry packets are ingested directly into a decoupled Zustand ring buffer (`useTelemetryStore.js`). The hardware wave is drawn directly to an HTML5 Canvas using `requestAnimationFrame`, isolating high-frequency sensor updates from React layout passes.

---

## 4. ML Risk Engine & Circuit Breaker Architecture

The `MLRiskClient` class wraps the remote anomaly detection model with an enterprise Circuit Breaker:

- **CLOSED State**: Requests are forwarded to the PyTorch/ML service endpoint with an 800ms strict timeout SLA.
- **OPEN State**: When 3 consecutive timeouts/failures occur, the circuit trips to OPEN. All subsequent evaluations bypass the network and immediately execute the deterministic clinical fallback heuristic without latency.
- **HALF-OPEN State**: After a 30-second cooldown period, a single probe request is attempted. If successful, the circuit resets to CLOSED; otherwise, it returns to OPEN.

### Deterministic Safety Rules
1. **Fall Impact + Immobility**: Fall impact signature + stationary motion state = `CRITICAL` (Score: 95).
2. **Cardio-Respiratory Divergence**: SpO2 < 92% and Heart Rate > 130 BPM = `CRITICAL` (Score: 92).
3. **Severe Hypoxia**: SpO2 < 90% = `HIGH` (Score: 75).
4. **Extreme Heart Rate Excursion**: HR > 140 BPM or HR < 45 BPM = `HIGH` (Score: 70).
5. **Manual SOS Trigger**: Hardware button pressed by senior = `CRITICAL` (Score: 90).

---

## 5. Security & RBAC Matrix

Authentication is implemented via cryptographic JSON Web Tokens (24h lifespan). Server-side authorization middleware (`requireRole`) protects sensitive resources:

| Resource Path | Permitted Roles | Description |
|---|---|---|
| `/api/auth/login` | Public | Credential authentication with bcrypt |
| `/api/auth/me` | Authenticated | Current user profile |
| `/api/auth/admin/*` | `admin` | System audit logs & configuration |
| `/api/emergency/health-event` | Authenticated / Device | Telemetry ingestion with eventId |
| `/api/emergency/:id/accept` | `caretaker`, `admin` | Responder acceptance |
| `/api/emergency/:id/decline` | `caretaker`, `admin` | Requires decline reason |
| `/api/emergency/:id/resolve` | `caretaker`, `admin` | Requires resolution notes |
| `/api/medicines` | `family`, `caretaker`, `admin` | Prescription CRUD & adherence |
