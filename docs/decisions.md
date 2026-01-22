# Architecture & Product Decisions (ADR-lite)

This document records significant decisions made during the project.

---

### 2026-01-22 — Protect `main` branch
**Decision:** No direct commits on `main`.  
**Reason:** Guarantee a stable baseline and avoid accidental regressions.  
**Consequence:** All work flows through `dev` and feature branches.

---

### 2026-01-22 — Local-first by default
**Decision:** Prioritize local execution and data ownership.  
**Reason:** Reduce operational complexity and avoid SaaS lock-in.  
**Consequence:** Initial storage and tooling favor simplicity over scale.

---

### 2026-01-22 — Event-based history
**Decision:** Track changes using an append-only event log.  
**Reason:** Ensure traceability and enable Git-like history.  
**Consequence:** State reconstruction is possible, but writes are immutable.

---

### 2026-01-22 — Minimal Python Backend
**Decision:** Use Python + FastAPI + Jinja2 for the initial bootstrap.  
**Reason:** Keep it simple, avoid frontend build tooling (no SPA), and ensure fast iteration.  
**Consequence:** Single-server architecture, local-first by default, no database yet.
