# Nura Backend Team Architecture

This README defines the target backend layout for multi-developer delivery. The structure is optimized for parallel feature work, low merge-conflict risk, and clean ownership boundaries.

## Architecture Principles
- Layered + ports/adapters style: domain and use-cases are isolated from vendor SDKs.
- One endpoint per file, one adapter per integration, one test module per behavior.
- Shared files stay small and stable (`main.py`, `router.py`, `settings.py`).
- Teams work in separate folders by responsibility to reduce rebasing overhead.

## Target Backend Directory Tree

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── deps.py
│   │   ├── errors.py
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── chat.py
│   │           ├── health.py
│   │           └── readiness.py
│   │
│   ├── core/
│   │   ├── settings.py
│   │   ├── constants.py
│   │   ├── logging.py
│   │   └── security.py
│   │
│   ├── domain/
│   │   ├── emergency/
│   │   │   ├── keywords.py
│   │   │   └── detector.py
│   │   ├── language/
│   │   │   └── policy.py
│   │   ├── facilities/
│   │   │   └── models.py
│   │   ├── benefits/
│   │   │   └── models.py
│   │   └── chat/
│   │       └── models.py
│   │
│   ├── application/
│   │   ├── use_cases/
│   │   │   ├── run_chat_flow.py
│   │   │   ├── run_emergency_flow.py
│   │   │   └── get_nearby_facilities.py
│   │   └── dto/
│   │       ├── chat_dto.py
│   │       └── facility_dto.py
│   │
│   ├── ports/
│   │   ├── geocoding_port.py
│   │   ├── facility_search_port.py
│   │   ├── benefit_retrieval_port.py
│   │   ├── llm_port.py
│   │   └── session_store_port.py
│   │
│   ├── infrastructure/
│   │   ├── geocoding/
│   │   │   └── google_maps_client.py
│   │   ├── db/
│   │   │   ├── supabase_client.py
│   │   │   ├── postgis_facility_search.py
│   │   │   └── session_store_firestore.py
│   │   ├── retrieval/
│   │   │   ├── pgvector_client.py
│   │   │   └── benefit_chunk_retriever.py
│   │   └── llm/
│   │       └── gemini_flash_client.py
│   │
│   ├── services/
│   │   ├── chat_orchestrator.py
│   │   ├── emergency_service.py
│   │   └── response_policy_service.py
│   │
│   └── schemas/
│       ├── chat.py
│       ├── facility.py
│       └── common.py
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── services/
│   ├── integration/
│   │   ├── db/
│   │   └── retrieval/
│   ├── contract/
│   │   └── api/
│   └── smoke/
│       └── demo_scenarios/
│
├── scripts/
│   ├── seed_data.py
│   ├── run_smoke_tests.ps1
│   └── check_env.py
├── docs/
│   ├── architecture.md
│   ├── api_contracts.md
│   └── data_indexing.md
├── requirements.txt
├── requirements-dev.txt
├── .env.example
└── README.md
```

## How To Navigate This Structure

### If your task is API behavior
Edit:
- `app/api/v1/endpoints/`
- `app/schemas/`

Do not place business rules in endpoint handlers.

### If your task is rules and policy (safety, language, disclaimers)
Edit:
- `app/domain/`
- `app/services/`
- `app/application/use_cases/`

Do not call external SDKs from `app/domain/`.

### If your task is external integration (Google Maps, Supabase, pgvector, Gemini)
Edit:
- `app/ports/`
- `app/infrastructure/`

Keep adapter implementations behind ports so API and use-cases remain stable.

### If your task is data retrieval and indexing
Edit:
- `app/infrastructure/db/`
- `app/infrastructure/retrieval/`
- `docs/data_indexing.md`

Include query assumptions and index strategy in docs with each change.

### If your task is tests
Mirror production paths in:
- `tests/unit/`
- `tests/integration/`
- `tests/contract/`
- `tests/smoke/`

Prefer narrow test ownership to avoid conflicts on large shared test files.

## Merge-Conflict Prevention Rules
- Keep `app/main.py` bootstrap-only.
- Keep `app/api/v1/router.py` as route registration only.
- Add one new file instead of expanding one giant module.
- Separate refactor commits from behavior commits.
- Open small PRs and merge in agreed order (indexing -> rag -> ui contract updates -> integration).

## Suggested Team Ownership
- Indexing engineer: `app/infrastructure/db`, `tests/integration/db`, `docs/data_indexing.md`
- RAG engineer: `app/infrastructure/retrieval`, `app/ports/benefit_retrieval_port.py`, `tests/integration/retrieval`
- API/UI contract engineer: `app/api`, `app/schemas`, `tests/contract/api`
- Project lead: `app/application/use_cases`, `app/services/chat_orchestrator.py`, release docs and smoke tests

## Incremental Adoption From Current Skeleton
Current backend is still a minimal skeleton. Migrate into this structure gradually:
1. Move config and constants into `app/core/`.
2. Introduce `app/api/v1/router.py` and split endpoint files.
3. Add ports and infrastructure adapters for geocoding, PostGIS, pgvector, and Gemini.
4. Move orchestration to `app/application/use_cases/run_chat_flow.py`.
5. Expand tests to include contract and smoke scenario coverage.
