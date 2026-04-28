<div align="center">

# Nura — Filipino Healthcare Access Navigator

### *Hindi doktor. Gabay sa pasilidad at benepisyo.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

<br/>

*A multilingual chatbot that helps Filipinos navigate the healthcare system — telling you **where to go**, **what to bring**, and **what to say at the front desk**. No diagnosis. No medical advice. Just practical access guidance.*

Built for **InnOlympics 2026 — Pangarap sa Kalusugan Track** | April 25–26, 2026 | KMC Exxa Tower, Taguig

[Overview](#-overview) •
[Key Features](#-key-features) •
[Architecture](#-architecture) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-quick-start) •
[API Reference](#-api-reference) •
[Team](#-team)

</div>

---

## Overview

Most Filipinos know free or subsidized healthcare options exist — but the systems are fragmented, the requirements are unclear, and navigating them wastes time and money that many can't afford to lose.

**Nura** solves this by acting as a conversational navigator:

1. User describes their concern in plain Filipino (or Cebuano, Ilocano, Hiligaynon, English)
2. Nura asks for their city and applicable benefits (PhilHealth, YAKAP, 4Ps, Senior, PWD, etc.)
3. Nura returns the **top facility** with name, address, what to bring, what to say, and an embedded map

> **Safety guarantee:** Emergency detection is deterministic keyword matching and always runs before any session lookup, LLM calls, RAG retrieval, or facility search. It cannot be bypassed.

---

## Key Features

<table>
<tr>
<td width="50%">

### Conversational Intelligence
- **Chat-Based Flow** — Not a form wizard. A real chat thread that preserves context
- **Emergency Detection** — Deterministic keyword classifier runs before any LLM call
- **Benefit-Aware Routing** — Filters facilities by PhilHealth, YAKAP, Malasakit, 4Ps, Senior, PWD
- **RAG-Backed Answers** — pgvector retrieval over PhilHealth benefit guides via Vertex AI

</td>
<td width="50%">

### Offline & Access-First Design
- **Multilingual** — Filipino-first; supports Cebuano, Ilocano, Hiligaynon, English
- **Care Pass** — Auto-saves last recommendation locally for offline access
- **Offline-Ready PWA** — Installable, cached shell, last results survive network loss
- **No Account Required** — Nothing stored on server; all session data is ephemeral

</td>
</tr>
</table>

---

## Architecture

```
Frontend (React/Vite PWA)
        │
        │  REST JSON
        ▼
Backend (FastAPI /api/v1)
        │
        ├── Emergency keyword classifier (deterministic, runs first)
        ├── Session repository (Supabase or in-memory fallback)
        ├── Orchestrator inference (Vertex Gemini — intent/city/benefit extraction)
        ├── AI/RAG service
        │      ├── Vertex text-embedding-004 (query embedding)
        │      ├── Supabase pgvector match_benefits RPC
        │      └── Gemini response composition + translation
        │
        └── Hospital service
               ├── Supabase health_facilities search
               ├── Exact city → fuzzy city → region fallback
               └── Frontend-compatible facility normalization
```

---

## Tech Stack

<table>
<tr>
<th>Category</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
<tr>
<td><b>Frontend</b></td>
<td>React 18 + TypeScript + Vite</td>
<td>Chat UI, PWA shell, offline caching</td>
</tr>
<tr>
<td><b>Styling</b></td>
<td>Tailwind CSS</td>
<td>Custom design tokens, Filipino civic register</td>
</tr>
<tr>
<td><b>API Framework</b></td>
<td>FastAPI + Uvicorn</td>
<td>High-performance async Python backend</td>
</tr>
<tr>
<td><b>Database</b></td>
<td>Supabase (PostgreSQL + pgvector)</td>
<td>Sessions, facility data, RAG embeddings</td>
</tr>
<tr>
<td><b>LLM Inference</b></td>
<td>Google Gemini 2.5 Flash</td>
<td>Response composition, orchestrator extraction</td>
</tr>
<tr>
<td><b>Embeddings</b></td>
<td>Vertex AI text-embedding-004</td>
<td>Benefit guide RAG retrieval</td>
</tr>
<tr>
<td><b>Translation</b></td>
<td>deep-translator</td>
<td>Optional dialect response translation</td>
</tr>
<tr>
<td><b>PWA</b></td>
<td>Workbox (vite-plugin-pwa)</td>
<td>Offline support, installable shell</td>
</tr>
<tr>
<td><b>Maps</b></td>
<td>Google Maps Embed API / OpenStreetMap</td>
<td>Facility map previews and directions</td>
</tr>
<tr>
<td><b>Deployment</b></td>
<td>Firebase / Google Cloud</td>
<td>Frontend hosting + Cloud Run backend</td>
</tr>
</table>

---

## Project Structure

```
nura/
├── backend/
│   ├── main.py                  # FastAPI app factory
│   ├── config.py                # Settings (pydantic-settings)
│   ├── dependencies.py          # DI wiring
│   ├── models/                  # Pydantic schemas
│   ├── routers/                 # /chat and /session endpoints
│   ├── services/
│   │   ├── orchestrator.py      # Main pipeline
│   │   ├── emergency_classifier.py
│   │   ├── orchestrator_inference.py
│   │   ├── ai_rag_service.py    # RAG retrieval + Gemini composition
│   │   └── hospital_service.py  # Facility search + normalization
│   ├── db/
│   │   ├── session_repository.py
│   │   ├── supabase_client.py
│   │   └── migrations/
│   └── scripts/
│       └── ingest_philhealth.py # PDF → pgvector ingestion
│
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── chat/            # Chat thread, bubbles, benefit picker
│       │   ├── layout/          # AppShell
│       │   ├── screens/         # Emergency, welcome
│       │   └── ui/              # Facility cards, map preview, chips
│       ├── lib/
│       │   ├── api.ts           # Backend client
│       │   ├── useNuraChat.ts   # Chat state machine
│       │   ├── emergency.ts     # Client-side keyword guard
│       │   └── storage.ts       # Care pass + offline cache
│       └── types/               # Shared TypeScript types
│
├── data/
│   └── emergency_keywords.json  # Tagalog, Cebuano, English keywords
│
└── docs/
    ├── plan.md
    └── llms.txt
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase project *(or run with `SESSION_BACKEND=memory` for local dev)*
- A Google API key for Gemini *(or skip for deterministic fallback mode)*

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Smoke test (no keys required):**

Set in `.env`:
```env
SESSION_BACKEND=memory
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_API_KEY=
```

Then: `GET http://127.0.0.1:8000/health` → `{"status": "ok"}`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | For full mode | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For full mode | Supabase server key |
| `SESSION_BACKEND` | No | `auto` (default), `memory`, or `supabase` |
| `GOOGLE_API_KEY` | For AI | Gemini API key |
| `VERTEX_PROJECT_ID` | For RAG | GCP project for embeddings |
| `VERTEX_LOCATION` | No | Defaults to `us-central1` |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` |
| `TRANSLATION_ENABLED` | No | Enable deep_translator (default: `true`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (default: `http://127.0.0.1:8000/api/v1`) |
| `VITE_USE_MOCK_API` | Set `true` to bypass backend entirely |
| `VITE_GOOGLE_MAPS_KEY` | Optional — enables Google Maps embed (falls back to OSM) |

---

## Database Setup

Run migrations in order in the Supabase SQL editor:

```
backend/db/migrations/001_create_sessions.sql
backend/db/migrations/002_create_rag_facility_tables.sql
```

Migration `002` creates:
- `benefit_guides` with `embedding vector(768)`
- `match_benefits()` pgvector RPC
- `health_facilities` table with city, region, PhilHealth, and Malasakit fields

### Ingesting Benefit Guides

```bash
python scripts/ingest_philhealth.py \
  --pdf path/to/philhealth_guide.pdf \
  --source "PhilHealth Benefits Guide 2025"
```

---

## API Reference

### `POST /api/v1/session`

```json
{ "language": "fil" }
```
Returns `{ "session_id": "...", "expires_at": "..." }`

### `POST /api/v1/chat`

```json
{
  "session_id": "...",
  "message": "Masakit ulo ko",
  "language": "fil",
  "location_city": "Quezon City",
  "benefits": ["PhilHealth"],
  "intent": "HOSPITAL"
}
```

**Response types:**

| `response_type` | Meaning |
|---|---|
| `EMERGENCY` | Emergency keyword matched. No LLM, RAG, session lookup, or facility search runs. |
| `FOLLOW_UP` | Session is missing city or benefits. |
| `RECOMMENDATION` | Facility search path completed. If no verified facility is found, the response is explicit and `data.facilities` is empty. |
| `RAG_ANSWER` | Benefit guide RAG path completed or returned fallback guidance. |

## Orchestration Rules

---

## Running Tests

```bash
# Backend
cd backend
python -m pytest tests/

# Frontend
cd frontend
npm run build   # TypeScript + Vite build check
```

---

## Safety Boundaries

Nura is an educational literacy and healthcare access tool. It does **not**:

- Diagnose conditions
- Recommend medications or dosages
- Assess clinical severity or triage patients
- Replace professional medical advice

For any message containing emergency keywords (chest pain, stroke, seizure, etc.), Nura immediately returns an emergency response directing the user to call 911 or go to the nearest ER. **This check runs before any LLM call and cannot be bypassed.**

---

If Supabase is unavailable or no candidates can be fetched, the service does not fabricate facility names. It returns an explicit no-verified-facility message and an empty `data.facilities` array.

**Track:** Pangarap sa Kalusugan — Health & Well-being Access

**Problem addressed:** Pangarap sa Serbisyong Medikal — Primary care access and system navigation.

**SDG alignment:** SDG 3 (Good Health and Well-being) · SDG 1 (No Poverty) · SDG 10 (Reduced Inequalities)

---

## Team

<div align="center">

### 🐔 Chicken Wings Team

<table>
<tr>
<td align="center">
<img src="https://github.com/2nieGarcia.png" width="100" style="border-radius: 50%"><br>
<b>Antonio Garcia</b><br>
<sub>Project Lead & Architecture</sub><br>
<sub>System design, backend orchestration, integration, and release</sub><br>
<a href="https://github.com/2nieGarcia">@2nieGarcia</a>
</td>
<td align="center">
<img src="https://github.com/projcjdevs.png" width="100" style="border-radius: 50%"><br>
<b>Charles Cabatian</b><br>
<sub>Data Engineering</sub><br>
<sub>Dataset cleaning, facility data pipeline, and ingestion scripts</sub><br>
<a href="https://github.com/projcjdevs">@projcjdevs</a>
</td>
<td align="center">
<img src="https://github.com/renzv-compsci.png" width="100" style="border-radius: 50%"><br>
<b>Renz Jerik Viloria</b><br>
<sub>AI Implementation</sub><br>
<sub>RAG pipeline, Gemini integration, embeddings, and translation layer</sub><br>
<a href="https://github.com/renzv-compsci">@renzv-compsci</a>
</td>
<td align="center">
<img src="https://github.com/NIghtIngale340.png" width="100" style="border-radius: 50%"><br>
<b>Mark Christian Anub</b><br>
<sub>Frontend Development</sub><br>
<sub>React chat UI, PWA shell, offline care pass, and UX design</sub><br>
<a href="https://github.com/NIghtIngale340">@NIghtIngale340</a>
</td>
</tr>
</table>


Expected result with populated facility data: `POST /api/v1/chat` returns `RECOMMENDATION`, a disclaimer-bearing message, and facilities under `data.facilities` and `data.hospitals`. If the facility table is empty or unavailable, the same endpoint returns `RECOMMENDATION` with a no-verified-facility message and empty facility arrays.
</div>
---

## License

MIT

---

<div align="center">

*Built with passion for AI engineering, Filipino healthcare equity, and making complex systems accessible to everyone.*

</div>