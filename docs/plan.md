# Nura Implementation Plan

Last updated: 2026-04-26

## Goal
Ship a safe, Filipino-first healthcare access navigator MVP with deterministic emergency handling and practical care-routing guidance.

## Current Status Snapshot
- Project skeleton is running for frontend and backend.
- Emergency-first deterministic guard exists on both frontend and backend.
- `/api/v1/chat` is typed and routes through emergency, session gating, intent, facility, and RAG services.
- Facility and RAG services now use real adapters when configured and contract-compatible fallbacks when not configured.

## Near-Term TODOs (Priority Order)

## P0 - Safety And Core Routing
- [ ] Expand emergency keyword set with reviewed Filipino and dialect variants.
- [ ] Add backend unit tests for emergency guard behavior.
- [ ] Add frontend tests to assert emergency path bypasses normal chat flow.

## P1 - Data And Retrieval Integrations
- [ ] Implement geocoding adapter (Google Maps Geocoding API).
- [x] Implement city-based facility search adapter (Supabase health_facilities).
- [x] Implement benefit guide retrieval adapter (Supabase pgvector).
- [x] Add fallback behavior when facility search, retrieval, Gemini, or translation fails.
- [ ] Add PostGIS nearby radius search if coordinates become available.

## P2 - Response Orchestration
- [x] Add Gemini response composer behind service boundaries.
- [x] Enforce strict system prompt and safety constraints in composition layer.
- [x] Add optional translation for supported language codes.
- [ ] Evaluate dialect quality with real demo prompts.

## P3 - UX And Reliability
- [ ] Improve facility card metadata coverage (hours, source year, reliability).
- [ ] Add retry UX and clearer weak-connection states.
- [ ] Add cache strategy validation for offline shell and last results.

## P4 - Delivery Readiness
- [ ] Add Firebase Hosting config placeholder and deployment notes check.
- [ ] Add Cloud Run deployment docs and env variable matrix.
- [ ] Add smoke tests for demo scenarios.

## Demo Scenario Checklist
- [ ] Normal YAKAP/public flow works end-to-end.
- [ ] No-benefits LGU flow works end-to-end.
- [ ] Emergency flow blocks standard navigation and prioritizes ER guidance.
- [ ] PhilCare flow includes 2024 data disclaimer and call-first reminder.

## Definition Of Done For MVP
- Deterministic emergency detection executes before LLM path.
- Typed request/response contract is stable across frontend and backend.
- Location + benefits produce practical facility guidance.
- Guidance includes what to bring and what to say.
- Safety and non-doctor disclaimers are always present.

## Maintenance Notes
- Keep this file synchronized with real implementation progress.
- When an item is done, mark it complete and add related file references in PR/commit notes.

## Parallel Delivery Plan (4 Developers, Low-Conflict)

### Branching And Merge Rules
- Base branch: `main`
- Integration branch: `release/mvp-core-routing`
- Feature branches:
	- `feat/indexing-postgis`
	- `feat/rag-benefit-retrieval`
	- `feat/frontend-ux-reliability`
	- `feat/lead-integration-qa`
- Keep each PR under ~400 lines changed when possible.
- Rebase feature branches daily to reduce drift.
- Merge order per sprint day: Indexing -> RAG -> UI/UX -> Project Lead integration.

### Work Breakdown And Commit History Plan

| Developer | Focus | Primary File Ownership (avoid overlap) | Step-by-step commit history (in order) | PR Gate Before Merge |
|---|---|---|---|---|
| Dev A | Indexing and facility retrieval performance | `backend/services/hospital_service.py`, `backend/db/migrations/`, `backend/tests/` | 1) `chore(db): add supabase db client and settings scaffolding`<br>2) `feat(indexing): add PostGIS nearby query with radius and benefit filters`<br>3) `feat(indexing): add ranking by reliability then distance`<br>4) `feat(indexing): add SQL migration docs for GIST index on geom and filter indexes`<br>5) `test(indexing): add integration tests for facility query edge cases`<br>6) `docs(indexing): add tuning guide and EXPLAIN checklist` | Query returns top 5 facilities in deterministic order for fixed seed data; integration tests pass. |
| Dev B | RAG retrieval and composition context | `backend/services/ai_rag_service.py`, `backend/scripts/ingest_philhealth.py`, `backend/tests/` | 1) `chore(rag): add pgvector client adapter and env wiring`<br>2) `feat(rag): implement benefit guide retrieval with top-k chunks`<br>3) `feat(rag): add retrieval fallback when vector store unavailable`<br>4) `feat(rag): implement response composer interface with strict prompt slots`<br>5) `test(rag): add unit tests for retrieval scoring and fallback behavior`<br>6) `test(contract): validate /chat response shape with retrieved guidance` | Retrieval returns bounded, source-labeled chunks; fallback path works; contract tests pass. |
| Dev C | Frontend UI/UX and reliability states | `frontend/src/components/`, `frontend/src/lib/api.ts`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/lib/emergency.ts`, `frontend/src/__tests__/` | 1) `feat(ui): improve facility cards for source, reliability, and hours visibility`<br>2) `feat(ui): strengthen emergency banner behavior and non-dismissable state`<br>3) `feat(ui): add weak-connection and retry affordances in chat flow`<br>4) `feat(ui): preserve draft input during loading and reconnect`<br>5) `test(ui): add emergency bypass tests and offline banner tests`<br>6) `chore(ui): align copy and labels to Filipino-first policy` | Emergency path bypasses normal flow in tests; offline/weak connection UX is visible and deterministic. |
| Dev D (Project Lead) | Integration, safety gates, and release readiness | `backend/main.py`, `backend/routers/`, `backend/services/orchestrator.py`, `docs/plan.md`, `docs/llms.txt`, root `README.md`, CI config files | 1) `chore(lead): define feature flags and env matrix for local/staging/prod`<br>2) `feat(lead): wire endpoint orchestration across emergency -> geocode -> facility -> rag -> response`<br>3) `test(lead): add smoke tests for 4 demo scenarios`<br>4) `docs(lead): update plan and llms context to reflect completed integrations`<br>5) `chore(lead): freeze MVP scope and add release checklist`<br>6) `release(lead): merge to release branch and tag demo candidate` | All 4 demo scenarios pass smoke tests; safety disclaimer always present; release checklist complete. |

### Merge Sequence Per Cycle
1. Dev A opens PR first; Dev B rebases after Dev A merge.
2. Dev B opens PR second; Dev C rebases after Dev B merge.
3. Dev C opens PR third; Project Lead rebases before integration PR.
4. Project Lead performs final integration PR and updates release notes.

### Conflict Prevention Checklist
- One owner per directory per sprint cycle.
- Shared files (`backend/main.py`, `frontend/src/App.tsx`, `docs/plan.md`) only edited by Project Lead unless pre-approved.
- Use short-lived feature flags for incomplete integrations.
- Do not mix refactors with feature behavior changes in one commit.
