# Nura Implementation Plan

Last updated: 2026-04-25

## Goal
Ship a safe, Filipino-first healthcare access navigator MVP with deterministic emergency handling and practical care-routing guidance.

## Current Status Snapshot
- Project skeleton is running for frontend and backend.
- Emergency-first deterministic guard exists on both frontend and backend.
- `/chat` is currently mocked and typed.

## Near-Term TODOs (Priority Order)

## P0 - Safety And Core Routing
- [ ] Expand emergency keyword set with reviewed Filipino and dialect variants.
- [ ] Add backend unit tests for emergency guard behavior.
- [ ] Add frontend tests to assert emergency path bypasses normal chat flow.

## P1 - Data And Retrieval Integrations
- [ ] Implement geocoding adapter (Google Maps Geocoding API).
- [ ] Implement PostGIS facility search adapter (Supabase Postgres + PostGIS).
- [ ] Implement benefit guide retrieval adapter (Supabase pgvector).
- [ ] Add fallback behavior when geocoding or retrieval fails.

## P2 - Response Orchestration
- [ ] Add Gemini Flash response composer behind service interface.
- [ ] Enforce strict system prompt and safety constraints in composition layer.
- [ ] Ensure language selection output follows policy (dialect-aware, Filipino fallback, English when pure English).

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
