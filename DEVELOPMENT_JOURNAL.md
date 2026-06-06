# DEVELOPMENT JOURNAL
## Rozi Khan Dropshipping Platform

**Project Manager:** Lead Architect / Developer
**Start Date:** [Insert Date]
**Status:** In Progress

---

## 1. Project Milestones & Sprints

### Sprint 1: Architecture & Foundation (Dates: --- to ---)
- [x] Define System Architecture & Tech Stack
- [x] Design PostgreSQL Schema (DATABASE_DESIGN.md)
- [x] Setup FastAPI Backend & React Frontend environments
- [x] Configure PostgreSQL & Alembic Migrations

### Sprint 2: Core Supply Side (Dates: --- to ---)
- [ ] Implement JWT Authentication & RBAC
- [ ] Build Supplier Registration & KYC Flow
- [ ] Develop Product Catalog APIs (CRUD)
- [ ] Setup Redis caching basics

---

## 2. Daily Log Template

**Date:** YYYY-MM-DD
**Hours Logged:** 8.0

**Completed Tasks:**
* Implemented FastAPI dependency injection for role-based auth.
* Designed the `users` and `suppliers` SQLAlchemy models.
* Generated Alembic revision `001_initial_auth`.

**Blockers / Issues:**
* Encountered circular import error between `models/user.py` and `models/supplier.py`.

**Solutions / Decisions:**
* Refactored models to use string-based relationship mappings (`"Supplier"`) instead of direct module imports to resolve circular dependency.

**Next Day Goals:**
* Connect JWT token generation logic.
* Begin building the React login page.

---

## 3. Technical Debt & Backlog

| Issue | Description | Priority | Target Sprint | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Missing Indexes** | Add B-Tree indexes on `orders.status` to speed up Admin queries. | Medium | Sprint 4 | Open |
| **API Pagination** | Standardize limit/offset pagination across all GET list endpoints. | High | Sprint 2 | In Progress |
| **Test Coverage** | Write PyTest fixtures for Supplier Auth flows. | Low | Sprint 5 | Open |

---

## 4. Architecture Decision Log (ADR)

### ADR-001: Selection of Database
* **Date:** [Date]
* **Decision:** Migrate from MongoDB to PostgreSQL.
* **Reasoning:** Dropshipping involves complex, multi-entity relationships (Order -> Retailer -> Supplier -> Variant). Maintaining data consistency across these domains in a NoSQL environment caused severe code-level join overhead. PostgreSQL handles ACID transactions strictly, ensuring financial and inventory accuracy.

### ADR-002: Background Processing
* **Date:** [Date]
* **Decision:** Utilize Celery with Redis broker instead of FastAPI `BackgroundTasks`.
* **Reasoning:** FastAPI's built-in background tasks run in the same event loop. For heavy tasks like syncing 10,000 inventory items to Shopify, this would block the API. Celery allows us to distribute this workload across separate worker instances.

---

## 5. Deployment & Release Log

* **v0.1.0-alpha** - [Date] - Deployed to Staging. Core authentication and catalog APIs functional.
* **v0.2.0-beta** - [Date] - Implemented Shiprocket API integration and Shopify Webhooks.

---

## 6. Monthly Retrospective

**Month:** [Month, Year]

**What went well:**
* Successfully migrated the data schema from Node/Mongo to Python/Postgres with zero data loss.
* FastAPI performance benchmarking shows 5x throughput compared to the old Express app.

**What could be improved:**
* Need to implement stricter Pydantic validation earlier in the workflow to catch bad inputs.
* Frontend state management (Context API) is getting messy; considering moving to Redux Toolkit or Zustand in the future if complexity grows.
