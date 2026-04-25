# Backend Architecture Guide (Team Workflow)

This document defines the target backend structure for Nura so multiple developers can work in parallel with minimal merge conflicts.

## Design Goals
- Keep feature work isolated by folder.
- Separate API, domain logic, services, and infrastructure adapters.
- Avoid giant shared files that force frequent rebases.
- Make test placement predictable for fast ownership and review.

## Target Backend Directory Structure

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── health.py
│   │           ├── chat.py
│   │           ├── facilities.py
│   │           └── benefits.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── constants.py
│   │   ├── errors.py
│   │   └── logging.py
│   │
│   ├── domain/
│   │   ├── safety/
│   │   │   └── emergency.py
│   │   ├── chat/
│   │   │   ├── entities.py
│   │   │   └── policies.py
│   │   ├── facility/
│   │   │   └── entities.py
│   │   └── benefits/
│   │       └── entities.py
│   │
│   ├── services/
│   │   ├── chat_orchestrator.py
│   │   ├── emergency_service.py
│   │   ├── language_service.py
│   │   └── response_composer.py
│   │
│   ├── repositories/
│   │   ├── protocols.py
│   │   ├── facility_repository.py
│   │   ├── benefit_repository.py
│   │   └── session_repository.py
│   │
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── supabase_client.py
│   │   │   └── postgis_queries.py
│   │   ├── vector/
│   │   │   └── pgvector_client.py
│   │   ├── external/
│   │   │   ├── geocoding_client.py
│   │   │   └── gemini_client.py
│   │   └── cache/
│   │       └── redis_client.py
│   │
│   └── schemas/
│       ├── common.py
│       ├── chat.py
│       └── facility.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── e2e/
│
├── scripts/
├── docs/
├── .env.example
├── requirements.txt
└── README.md
```

## Team Navigation Rules

### 1) If you add or modify an API endpoint
Work in:
- `app/api/v1/endpoints/`
- `app/schemas/`

Do not place business rules inside endpoint files.

### 2) If you change business rules (safety, language, eligibility)
Work in:
- `app/domain/`
- `app/services/`

Do not call vendor SDKs directly from domain modules.

### 3) If you integrate external systems (Supabase, pgvector, Maps, Gemini)
Work in:
- `app/infrastructure/`
- `app/repositories/`

Expose stable interfaces in `app/repositories/protocols.py` so API and service layers remain decoupled.

### 4) If you update app-wide settings and logging
Work in:
- `app/core/`

Keep environment and config concerns centralized there.

### 5) If you write tests
Mirror production location under:
- `tests/unit/`
- `tests/integration/`
- `tests/contract/`
- `tests/e2e/`

## Merge Conflict Prevention Conventions
- Prefer one file per endpoint (avoid one giant router module).
- Prefer one adapter file per integration target.
- Register routes in a single lightweight `router.py`, not in `main.py`.
- Keep `main.py` very small (app bootstrap only).
- Avoid broad refactors mixed with feature commits.
- Use feature branches and merge small, frequent PRs.

## Suggested Ownership by Layer
- Safety and language policies: `app/domain/safety`, `app/services/emergency_service.py`, `app/services/language_service.py`
- API contracts and handlers: `app/api`, `app/schemas`
- Data and external adapters: `app/repositories`, `app/infrastructure`
- Reliability and QA: `tests/`, `scripts/`, CI docs

## Migration Note From Current Skeleton
Current code is still a thin skeleton under `app/main.py`, `app/schemas/`, and `app/services/`.
Adopt this structure incrementally per feature to avoid disruptive large PRs.
