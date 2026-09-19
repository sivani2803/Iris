# IRIS — Intelligent Response & Integrated Senior-Care Network

> *"Care that responds, even when they can't."*

IRIS is an enterprise-grade senior-care coordination platform designed to bridge senior citizens, family members, professional caregivers, healthcare providers, and emergency support networks into a unified, reliable, real-time safety ecosystem.

---

## 🏗️ Architecture Overview

```
                          ┌────────────────────────┐
                          │   IRIS Wearable Watch  │
                          │  / Hardware Simulator  │
                          └───────────┬────────────┘
                                      │ (HTTP Telemetry / Idempotent eventId)
                                      ▼
                          ┌────────────────────────┐
                          │    IRIS REST & WS API  │
                          │  (Express + Socket.IO) │
                          └───────────┬────────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
    ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
    │ MongoDB Datastore  │ │   ML Risk Engine   │ │  Google Gemini AI  │
    │  (State of Truth   │ │ (Circuit Breaker & │ │ (Multilingual Non- │
    │  + Audit Logging)  │ │ Fallback Heuristic)│ │ Diagnostic Guide)  │
    └────────────────────┘ └──────────┬─────────┘ └────────────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │   Matching & Dispatch  │
                          │  (Candidate Selection  │
                          │   + Reassessment)      │
                          └───────────┬────────────┘
                                      │ (Real-Time State Broadcasts)
                                      ▼
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ Senior Dashboard │        │ Family Dashboard │        │Caretaker Command │
│ (Accessible UI,  │        │ (Peace of Mind,  │        │ (Action-First,   │
│ 1-Tap SOS, Voice)│        │ Graph, Timeline) │        │ Dispatch, Route) │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

---

## 🌟 Key Capabilities & Production Pillars

1. **Closed-Loop Emergency Lifecycle**:
   - State transition validation (`DETECTED` &rarr; `ASSIGNED` &rarr; `ACKNOWLEDGED` &rarr; `EN_ROUTE` &rarr; `ARRIVED` &rarr; `RESOLVED`).
   - Rejects illegal transitions (e.g. `RESOLVED` &rarr; `EN_ROUTE`) with HTTP 400.
   - Autonomous reassessment upon responder decline with mandatory reason logging.
   - Fail-safe Level 3 direct escalation to National Emergency Services (EMS 108).

2. **Idempotency & Device Traceability**:
   - `eventId` deduplication window prevents duplicate emergencies on sensor retries.
   - Hardware pairing registry (`Device` model) tracking battery, firmware, and heartbeat.

3. **High-Frequency Real-Time Telemetry**:
   - WebSocket streaming via Socket.IO directly to Zustand ring buffer.
   - RequestAnimationFrame (RAF) Canvas waveform renderer (`PulseWaveCanvas.jsx`) running at 60 FPS without React component tree reconciliation overhead.

4. **Clinical Safety & Non-Diagnostic AI Assistant**:
   - Empathetic symptom guidance respecting medical guardrails (never diagnose, clear escalation to 108/caretaker).
   - Multilingual voice interaction (English, Telugu, Hindi) with visual states (`Listening...`, `Processing...`, `IRIS is responding...`).
   - Graceful fallback when external AI services are unreachable.

5. **Security, Privacy & RBAC**:
   - Cryptographic JWT access control with bcrypt password hashing.
   - Server-side role enforcement (`admin`, `family`, `caretaker`, `senior`).
   - Comprehensive HIPAA/DISHA audit logging (`AuditLog` model).
   - Distributed request traceability via `X-Request-Id` headers.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js v18+ (tested on v24)
- npm v9+
- Optional: Local MongoDB (if unavailable, backend automatically initializes in-memory MongoDB)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The server will start on port `5000`:
- Health check: `http://localhost:5000/api/health`
- Readiness probe: `http://localhost:5000/api/ready`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at:
- Web App: `http://localhost:5173/`
- Smartwatch Hardware Simulator: `http://localhost:5173/simulator`
- Family Peace-of-Mind Command: `http://localhost:5173/family`
- Caretaker Rapid Response Portal: `http://localhost:5173/caretaker`
- Senior Accessible Dashboard: `http://localhost:5173/senior`
- AI Care Assistant: `http://localhost:5173/ai`

---

## 👥 Seeded Demo Accounts

All demo accounts are pre-seeded with bcrypt hash for password: `Password123!`

| Role | Email | Password | Intended Screen |
|------|-------|----------|-----------------|
| **Family** | `family@iris.care` | `Password123!` | `/family` |
| **Caretaker** | `caretaker@iris.care` | `Password123!` | `/caretaker` |
| **Senior** | `senior@iris.care` | `Password123!` | `/senior` |
| **Admin** | `admin@iris.care` | `Password123!` | `/family` & `/api/auth/admin/*` |

---

## 🧪 Automated Testing Suite

Ensure the backend server is running (`node server.js`), then run the test suites:

```bash
cd backend

# 1. Hardened Pipeline & Idempotency Verification
node test_hardened_pipeline.js

# 2. Complete End-to-End System Verification (11 Suites)
node test_e2e_full.js

# 3. Enterprise Architecture & RBAC Verification (4 Pillars)
node test_enterprise.js

# 4. Milestone 2 Emergency Reassessment Workflow
node test_milestone2.js

# 5. Multilingual AI Assistant & Triage
node test_ai.js
```

---

## 📄 License & Compliance

IRIS is developed in accordance with senior-care digital health standards and strict safety guardrails. All clinical evaluation heuristics are non-diagnostic decision-support protocols.
"# Iris" 

dsfbhhbfysdbhfzsjdfuhbfushzbdf zsjdnchusbfhubszdyfzshff
I'm Sirija

