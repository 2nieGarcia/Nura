# Nura

Nura is a multilingual healthcare access navigator for Filipinos. It helps users understand available benefits, find relevant accredited facilities, and prepare what to ask at the facility desk.

Nura is not a doctor. It does not diagnose, prescribe, assess clinical severity, or replace professional medical care. Emergency routing is deterministic keyword matching and always runs before session lookup, LLM calls, RAG retrieval, or facility search.

Built for InnOlympics 2026 - Pangarap sa Kalusugan Track.

## Current Architecture

```text
Frontend (React/Vite)
        |
        | REST JSON
        v
Backend (FastAPI, /api/v1)
        |
        +-- emergency keyword classifier
        +-- session repository (Supabase or memory fallback)
        +-- orchestrator inference (optional Vertex Gemini extraction)
        +-- AI/RAG service
        |      +-- Vertex text-embedding-004 query embeddings
        |      +-- Supabase pgvector match_benefits RPC
        |      +-- Gemini response composition
        |      +-- optional response translation
        |
        +-- hospital service
               +-- Supabase health_facilities search
               +-- exact city, fuzzy city, region fallback from real rows
               +-- frontend-compatible facility normalization
```

The source of truth is this `Nura` repo. The separate `nura-rag/backend/app` shape was merged into the existing `Nura/backend` service boundaries rather than copied as a second app.

## Repository Structure

```text
Nura/
|-- backend/
|   |-- main.py
|   |-- config.py
|   |-- dependencies.py
|   |-- models/
|   |   |-- chat.py
|   |   |-- session.py
|   |-- routers/
|   |   |-- chat.py
|   |   |-- session.py
|   |-- services/
|   |   |-- orchestrator.py
|   |   |-- emergency_classifier.py
|   |   |-- orchestrator_inference.py
|   |   |-- ai_rag_service.py
|   |   |-- hospital_service.py
|   |-- db/
|   |   |-- session_repository.py
|   |   |-- supabase_client.py
|   |   |-- migrations/
|   |       |-- 001_create_sessions.sql
|   |       |-- 002_create_rag_facility_tables.sql
|   |-- scripts/
|       |-- ingest_philhealth.py
|
|-- frontend/
|   |-- src/lib/api.ts
|   |-- src/types/chat.ts
|   |-- src/types/facility.ts
|
|-- data/emergency_keywords.json
|-- docs/
|-- README.md
```

## Backend Setup

```powershell
cd Nura\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

For local smoke tests without Supabase or Gemini, set:

```env
SESSION_BACKEND=memory
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_API_KEY=
VERTEX_PROJECT_ID=
```

Run the API:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

## Backend Environment Variables

Copy `backend/.env.example` to `backend/.env`.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL for sessions, RAG, and facilities. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key. Required for Supabase-backed runtime and ingestion. |
| `SESSION_BACKEND` | `auto`, `memory`, or `supabase`. Use `memory` for local frontend smoke tests. |
| `SESSION_TTL_MINUTES` | Rolling session expiration window. |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins for CORS. |
| `VERTEX_PROJECT_ID` or `GCP_PROJECT_ID` | Google Cloud project for Vertex embeddings and optional orchestrator inference. |
| `VERTEX_LOCATION` or `GCP_REGION` | Vertex location. Defaults to `us-central1`. |
| `VERTEX_MODEL` | Optional orchestrator extraction model used before rule fallback. |
| `VERTEX_TIMEOUT_SECONDS` | Timeout for orchestrator extraction calls. |
| `GOOGLE_API_KEY` | Gemini API key for answer composition. If missing, service falls back to deterministic copy. |
| `GEMINI_MODEL` | Gemini model for response composition. |
| `GEMINI_TIMEOUT_SECONDS` | Timeout for Gemini response composition. |
| `RAG_EMBEDDING_MODEL` | Vertex embedding model. Default: `text-embedding-004`. |
| `RAG_MATCH_RPC` | Supabase RPC name for pgvector retrieval. Default: `match_benefits`. |
| `RAG_MATCH_THRESHOLD` | Similarity threshold passed to the RPC. |
| `RAG_MATCH_COUNT` | Maximum retrieved benefit chunks. |
| `TRANSLATION_ENABLED` | Enables `deep_translator` response translation when language is not English. |
| `FACILITY_TABLE_NAME` | Facility table. Default: `health_facilities`. |
| `FACILITY_DEFAULT_REGION` | Optional region prefilter. Leave blank when only city is known. |
| `FACILITY_RESULT_LIMIT` | Maximum facilities returned to the frontend. |
| `FACILITY_MAX_CANDIDATES` | Candidate rows fetched before exact/fuzzy matching. |
| `FACILITY_FUZZY_THRESHOLD` | Fuzzy city match threshold from 0 to 100. |

## API Contract

Base URL:

```text
http://127.0.0.1:8000/api/v1
```

### `POST /session`

Request:

```json
{
  "language": "fil"
}
```

Response:

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2026-04-26T11:00:00Z"
}
```

### `POST /chat`

Request:

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Masakit ulo ko. Saan ako pwede pumunta?",
  "concern": "Masakit ulo ko",
  "language": "fil",
  "location_city": "Quezon City",
  "benefits": ["PhilHealth"],
  "intent": "HOSPITAL"
}
```

`concern`, `language`, `location_city`, `benefits`, and `intent` are optional. The frontend sends `concern` when the latest user turn is a location, benefit, or follow-up answer so backend recommendations still use the original symptom/concern.

Response:

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_type": "RECOMMENDATION",
  "message": "Hindi ako doktor...",
  "data": {
    "facilities": [
      {
        "name": "<name_of_health_facility from health_facilities>",
        "address": "<street and municipality_city from health_facilities>",
        "accreditation": "PhilHealth Accredited",
        "benefit_to_claim": "Ask the PhilHealth desk to verify coverage and requirements.",
        "what_to_say": "Magpapa-assess po ako...",
        "what_to_bring": "Valid ID...",
        "maps_url": "https://maps.google.com/?q=...",
        "data_source": "YAKAP",
        "data_reliability": "LOW"
      }
    ],
    "hospitals": [
      {
        "name": "<name_of_health_facility from health_facilities>",
        "address": "<street and municipality_city from health_facilities>",
        "data_source": "YAKAP"
      }
    ]
  },
  "missing_fields": []
}
```

The backend always keeps facilities consumable through `data.facilities`. It also includes `data.hospitals` as an alias for compatibility with existing frontend normalization.

Response types:

| Type | Meaning |
|---|---|
| `EMERGENCY` | Emergency keyword matched. No LLM, RAG, session lookup, or facility search runs. |
| `FOLLOW_UP` | Session is missing city or benefits. |
| `RECOMMENDATION` | Facility search path completed. If no verified facility is found, the response is explicit and `data.facilities` is empty. |
| `RAG_ANSWER` | Benefit guide RAG path completed or returned fallback guidance. |

## Orchestration Rules

The backend pipeline in `services/orchestrator.py` is:

1. Emergency keyword detection.
2. Session lookup and session update.
3. Session completeness gate for `location_city` and `benefits`.
4. Intent resolution from request, optional LLM extraction, or rules.
5. Hospital service or AI/RAG service call.

Do not move LLM, RAG, or facility work before steps 1-3.

## Database Setup

Run these migrations in order in the Supabase SQL editor:

```text
backend/db/migrations/001_create_sessions.sql
backend/db/migrations/002_create_rag_facility_tables.sql
```

`002_create_rag_facility_tables.sql` creates:

- `benefit_guides` with `embedding vector(768)`.
- `match_benefits(query_embedding, match_threshold, match_count)` RPC.
- `health_facilities` with city, region, PhilHealth, and Malasakit fields.

The RAG retriever expects the RPC to return `id`, `content`, `source`, and `similarity`.

## Ingesting Benefit Guides

After running the RAG migration and configuring Supabase plus Vertex:

```powershell
cd Nura\backend
venv\Scripts\activate
python scripts\ingest_philhealth.py --pdf path\to\philhealth_benefits.pdf --source "PhilHealth Benefits Guide"
```

The script extracts PDF text, chunks it, embeds chunks with Vertex `text-embedding-004`, and inserts rows into `benefit_guides`. It has no hardcoded local paths.

## Facility Data Requirements

Populate `health_facilities` with at least:

```text
name_of_health_facility
street
municipality_city
region
is_philhealth
is_malasakit
expire_date
source
```

Facility search performs:

1. Optional region prefilter from `FACILITY_DEFAULT_REGION`.
2. Benefit flag filters when the user has PhilHealth, YAKAP, Senior, PWD, 4Ps, or Malasakit.
3. Exact city match.
4. Fuzzy city match.
5. Region or candidate fallback.

If Supabase is unavailable or no candidates can be fetched, the service does not fabricate facility names. It returns an explicit no-verified-facility message and an empty `data.facilities` array.

## Frontend Setup

```powershell
cd Nura\frontend
npm install
copy .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_USE_MOCK_API=false
```

Open:

```text
http://127.0.0.1:5173
```

## Local Smoke Test

1. Start the backend with `SESSION_BACKEND=memory`.
2. Start the frontend with `VITE_USE_MOCK_API=false`.
3. Enter a concern such as `Masakit ulo`.
4. Enter `Quezon City`.
5. Select `PhilHealth`.
6. Submit benefits.

Expected result with populated facility data: `POST /api/v1/chat` returns `RECOMMENDATION`, a disclaimer-bearing message, and facilities under `data.facilities` and `data.hospitals`. If the facility table is empty or unavailable, the same endpoint returns `RECOMMENDATION` with a no-verified-facility message and empty facility arrays.

## Verification Commands

Backend:

```powershell
cd Nura
python -m pytest .\backend\tests
python -m py_compile .\backend\config.py .\backend\dependencies.py .\backend\services\ai_rag_service.py .\backend\services\hospital_service.py .\backend\scripts\ingest_philhealth.py
```

Frontend contract/build check:

```powershell
cd Nura\frontend
npm run build
```

## Safety Boundary

Nura is strictly an educational literacy and healthcare access tool. It does not provide medical diagnoses, clinical assessments, treatment recommendations, prescriptions, dosage guidance, or medical triage. For emergency keywords, Nura immediately tells the user to call emergency services or go to the nearest ER.
