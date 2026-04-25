# Nura

Multilingual AI health navigator for Filipinos who do not know what they are entitled to.

Nura is a chatbot that helps health-illiterate Filipinos navigate the public healthcare system in their own dialect. It surfaces accredited hospitals based on the user's location and benefit coverage, explains what those benefits actually include, and routes life-threatening inputs to an emergency alert before any other logic runs.

Built for **InnOlympics 2026** — *Pangarap sa Kalusugan Track*.

---

## Table of Contents

- [Project Overview](#project-overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture & Responsibilities](#architecture--responsibilities)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Backend & Session Setup (Lead)](#backend--session-setup-lead)
- [API Contracts](#api-contracts)
- [Emergency Keyword System](#emergency-keyword-system)
- [Data / Hospital Recommender Setup (TBD)](#data--hospital-recommender-setup-tbd)
- [AI / RAG Pipeline Setup (TBD)](#ai--rag-pipeline-setup-tbd)
- [Frontend Setup (TBD)](#frontend-setup-tbd)
- [Team](#team)
- [Disclaimer](#disclaimer)

---

## Project Overview

**Project name:** Nura  
**Track:** Pangarap sa Kalusugan — Health and Well-being Access  
**Event:** InnOlympics 2026, April 25-26, KMC EXXA Tower  

**Target audience:** Non-health-literate Filipinos who avoid consultations because they believe medical care is unaffordable, unaware that their PhilHealth membership covers free or subsidized services at accredited public hospitals.

**Core constraint:** Nura is strictly an educational literacy tool and hospital navigator. It does not diagnose conditions, assess clinical severity, or recommend treatments. The emergency routing step is keyword-based pattern matching — not a medical triage assessment. This distinction must be communicated clearly during the demo.

---

## The Problem

Millions of Filipinos avoid doctors not because they lack coverage, but because they do not know they have it. The barriers are informational, not just financial:

- Benefit documents are written in formal Filipino or English, inaccessible to low-literacy users.
- Hospital accreditation lists are maintained as inconsistently formatted data or unstructured spreadsheets.
- Health information is not widely available in regional dialects.

The result: people who are already covered choose to delay care rather than going to a hospital that would serve them for free.

---

## The Solution

Nura routes every incoming message through a fixed pipeline orchestrated by the backend API:

1. **Emergency keyword detection.** Runs first. If the message contains phrases associated with life-threatening situations, Nura halts and returns an emergency alert.
2. **Session completeness check.** If the system does not yet have the user's city and benefit membership, it asks follow-up questions before proceeding.
3. **Intent routing & Retrieval.** (To be implemented by AI & Data teams). The backend will route the completed session data to either the RAG pipeline (for benefit questions) or the Hospital Recommender (for location searches).
4. **Response composition.** The final generated response is returned to the frontend via the API.

---

## Architecture & Responsibilities

The architecture is decoupled to allow the team to work in parallel. The backend API handles state and routing, while delegating the heavy lifting to the modules built by the rest of the team.

```text
User (Browser / UI) ---> [ FRONTEND TEAM ]
                              |
                        JSON over REST
                              v
                      [ BACKEND / LEAD ]
                  FastAPI Orchestrator & API
                              |
    +-------------------------+-------------------------+
    |                         |                         |
[ SESSIONS ]              [ AI / RAG ]              [ DATA ]
Supabase Table            Document Embedding        Hospital Cleaning
(Backend Lead)            & Generation              & Recommender
                          (AI Team)                 (Data Team)

```

---

## Tech Stack

| Layer | Technology | Owner |
|-------|------------|-------|
| Backend API & Orchestration | FastAPI (Python 3.11) | Project Lead |
| Session Database | Supabase (PostgreSQL) | Project Lead |
| LLM & Embeddings | TBD by AI Engineer | AI / LLM Engineer |
| Hospital DB & Search | TBD by Data Engineer | Data / Locator |
| Frontend & Maps | TBD by Frontend Dev | Frontend Developer |

---

## Repository Structure

```text
nura/
|
|-- backend/
|   |-- main.py                        # FastAPI entry point
|   |-- requirements.txt
|   |-- .env.example
|   |
|   |-- routers/
|   |   |-- chat.py                    # POST /api/v1/chat
|   |   |-- hospitals.py               # GET /api/v1/hospitals (Connects to Data team logic)
|   |   |-- sessions.py                # POST & GET /api/v1/session
|   |
|   |-- services/
|   |   |-- orchestrator.py            # Main logic flow & routing
|   |   |-- emergency_classifier.py    # Deterministic keyword check
|   |   |-- ai_rag_service.py          # [INTERNAL] Placeholder for AI Team's logic
|   |   |-- hospital_service.py        # [INTERNAL] Placeholder for Data Team's logic
|   |
|   |-- db/
|       |-- supabase_client.py
|       |-- migrations/
|           |-- 001_create_sessions.sql
|
|-- data/
|   |-- emergency_keywords.json        # Multilingual emergency keyword list
|   |-- [TBD_hospital_datasets/]       # Workspace for Data team
|   |-- [TBD_philhealth_docs/]         # Workspace for AI team
|
|-- frontend/
|   |-- [TBD by frontend developer]
|
|-- README.md
```

---

**3. Backend & Session Setup (Lead):**


## Backend & Session Setup (Lead)

This section covers the setup for the base API and session management.

### Prerequisites

- Python 3.11
- Supabase account and project

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your keys.

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
SESSION_TTL_MINUTES=60
```

### Running the API

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Session Database Migration

Run this in your Supabase SQL Editor to initialize the session store:

```SQL
CREATE TABLE sessions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language             TEXT,
    location_city        TEXT,
    location_raw         TEXT,
    benefits             TEXT[] DEFAULT '{}',
    conversation_history JSONB DEFAULT '[]',
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    expires_at           TIMESTAMPTZ DEFAULT NOW() + INTERVAL '60 minutes'
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```


---

## API Contracts

These are the endpoints the Frontend Developer will call. The Backend API acts as the bridge between the UI and the modules created by the Data and AI teams.

**Base URL:** `http://localhost:8000/api/v1`

### 1. `POST /session`

Creates a new session. Call once on first page load.

**Response:**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2026-04-26T11:00:00Z"
}
```

### 2. `POST /chat`
The main endpoint for the conversation.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Masakit ang likod ko"
}
```

Response Type Examples:

- `EMERGENCY`: Returned if the backend detects life-threatening keywords.
- `FOLLOW_UP`: Returned if the user hasn't provided their location or benefits yet.
- `RECOMMENDATION`: Returned when the API successfully queries the Data Team's hospital list.
- `RAG_ANSWER`: Returned when the API successfully queries the AI Team's benefit documentation.

### 3. GET /hospitals

Filtered list for a standalone map view. Wired to the Data Team's database logic.

---

## Emergency Keyword System

The emergency classifier in `services/emergency_classifier.py` is a deterministic system. It checks the user's message against `data/emergency_keywords.json` in multiple dialects (Tagalog, Cebuano, English, etc.) before any AI processing happens.

---

## Data / Hospital Recommender Setup (TBD)

Owner: Data / Locator Team Member

Placeholders for Data Team:

- Provide the cleaned hospitals table schema.
- Provide the logic for the `hospital_service.py` to filter by city/accreditation.

---

## AI / RAG Pipeline Setup (TBD)

Owner: AI / LLM Engineer

Placeholders for AI Team:

- Provide document embedding logic (Vertex AI / pgvector).
- Provide the logic for `ai_rag_service.py` to generate answers based on PhilHealth PDFs.

---

## Local Frontend + Backend Run

The current UI is wired to the FastAPI backend at `http://127.0.0.1:8000/api/v1`.
For local development without Supabase, use the in-memory session fallback.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
set SESSION_BACKEND=memory
set ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Use `SESSION_BACKEND=supabase` with real `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` when the Supabase session table is ready.

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

`frontend/.env` should include:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_USE_MOCK_API=false
```

### Integrated Smoke Test

1. Open `http://127.0.0.1:5173/`.
2. Enter a concern such as `Masakit ulo`.
3. Enter `Quezon City`.
4. Select `PhilHealth`.
5. Submit benefits.

The frontend creates a backend session through `POST /api/v1/session`, then
sends the completed intake to `POST /api/v1/chat`. The current hospital results
come from `services/hospital_service.py`, which is still a placeholder until the
Data Team's real recommender is available.

---

## Team

| Member | Role | Responsibilities |
|--------|------|------------------|
| Antonio Garcia | Project Lead | API Orchestration, Session DB, Endpoint logic, JSON Contracts, Project Architecture| 
| Mark Anub | Frontend Developer | UI/UX, API consumption |
| Charles Cabatian | Data / Locator | Hospital data cleaning, DB search logic |
| Renz Viloria | AI / LLM Engineer | RAG Pipeline, PDF processing, prompt engineering |

---

## Disclaimer

Nura is strictly an educational literacy tool and hospital navigator. It does not provide medical diagnoses, clinical assessments, treatment recommendations, or medical triage of any kind. Emergency routing is deterministic keyword-based pattern matching and is not a substitute for professional medical evaluation.

