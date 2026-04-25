# Nura

> **Filipino dialect-aware healthcare navigation assistant for Filipinos who need to know where to go, what benefit to use, and what to bring — without pretending to be a doctor.**

Nura is a lightweight Progressive Web App (PWA) that helps users navigate Philippine healthcare access. A user can describe a symptom in Filipino or major Philippine dialects/languages, provide their location and benefit status, and receive nearby facility recommendations with benefit guidance such as YAKAP, Malasakit, Senior Citizen, PWD, 4Ps, PhilCare, or LGU free primary care.

This project is designed for the **InnOlympics 2026 — Pangarap sa Kalusugan** track, specifically the problem of **primary care access and system navigation**.

## Initial Commit Skeleton (Current State)

This repository now includes a minimal runnable skeleton with clear module boundaries:

- `frontend/` React + Vite + TypeScript + Tailwind + PWA shell
- `backend/` FastAPI API skeleton with deterministic emergency guard and mocked `/chat`
- Shared API shape aligned through typed frontend contracts and typed backend schemas

### Quick Start

Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Current Safety Guarantees in Skeleton

- Nura is not a doctor and does not diagnose or prescribe
- Emergency detection is deterministic and runs before mocked chat flow
- Language response rule is deterministic:
  - pure English input -> English response
  - mixed or unclear dialect -> simple Filipino fallback

### Explicit Integration TODOs

- Replace mock geocoding with Google Maps Geocoding API
- Replace mock facility list with Supabase Postgres + PostGIS query layer
- Replace mock benefit guidance with pgvector retrieval
- Replace mock final response composer with Gemini Flash orchestration

---

## Core Positioning

Nura is **not an AI doctor**.

It does **not** diagnose disease, prescribe medicine, replace clinical care, or store medical records. It is a **healthcare access navigator** that helps Filipinos answer practical questions:

- Saan ako pwedeng magpatingin?
- May libre or discounted option ba?
- Anong benefit ang pwede kong gamitin?
- Ano ang kailangan kong dalhin?
- Ano ang sasabihin ko sa front desk?
- Emergency ba ito?

---

## Final MVP Scope

### Must Build

- Any Filipino dialect/language input
- Rule-based emergency detection before any AI call
- Location collection: city/barangay or  location
- Benefit checkbox collection
- Nearby facility matching using PostGIS
- Benefit explanation using RAG
- Gemini-generated final response in the user's dialect/language (with Filipino or English fallback)
- Facility cards with Google Maps links
- Source and reliability badges
- Offline shell and cached last results

### Do Not Build for MVP

- Login system
- User accounts
- QR/NFC medical card
- Medical record storage
- Appointment booking
- Admin dashboard
- Doctor chat
- Full nationwide live coverage
- Complex analytics

---

## Final Tech Stack

| Layer | Final Technology | Reason |
|---|---|---|
| Frontend | React + Vite + TypeScript PWA | Lightweight, fast, installable, low-end Android friendly |
| PWA / Offline | vite-plugin-pwa + Workbox | Offline shell, cached last facility result, auto-update service worker |
| Styling | Tailwind CSS | Fast responsive UI with consistent spacing and accessibility |
| Frontend State | React hooks + `useReducer` | No Redux/Zustand needed for a linear chat flow |
| Hosting | Firebase Hosting | Fast static hosting and strong Google technology story |
| Backend | FastAPI on Cloud Run | Simple Python backend for RAG, routing, and AI orchestration |
| Session State | Firestore | Persists user session through dropped connections |
| Facility Database | Supabase Postgres + PostGIS | Fast geospatial filtering and existing team familiarity |
| Vector / RAG Store | Supabase pgvector | Same database instance, simpler hackathon deployment |
| Embeddings | Vertex AI `text-embedding-004` | Google-powered retrieval layer |
| LLM | Gemini Flash via Vertex AI | Fast, cost-efficient, strong Filipino multilingual response generation |
| Geocoding | Google Maps Geocoding API | Converts city/barangay into coordinates |
| Routing Display | Google Maps deep links | One-tap directions without embedding a heavy map |

---


## High-Level Architecture

./docs/screenshots/architecture.png

---

## Final User Flow

```text
User: "Masakit mata ko, 3 days na, nasa Quezon City ako."

1. Frontend checks emergency keywords.
2. If not emergency, app asks for benefit status:
   - PhilHealth / YAKAP
   - Senior Citizen
   - PWD
   - 4Ps
   - PhilCare
   - Wala / Hindi sure
3. Backend geocodes the user location.
4. Backend searches nearby facilities using PostGIS.
5. Backend retrieves benefit guidance using pgvector.
6. Gemini generates a safe response in the user's dialect/language.
7. User sees:
   - recommended facilities
   - benefit to claim
   - documents to bring
   - exact front-desk script
   - Google Maps link
   - source / reliability label
```

---

## Emergency-First Safety Rule

Emergency detection must happen **before** normal AI/RAG processing.

The LLM should never be the only emergency detector. The system uses a deterministic keyword guard on both frontend and backend.

### Emergency Keywords

```ts
const EMERGENCY_KEYWORDS = [
  "hirap huminga",
  "hindi makahinga",
  "masakit dibdib",
  "pananakit ng dibdib",
  "chest pain",
  "stroke",
  "seizure",
  "kombulsyon",
  "walang malay",
  "unconscious",
  "matinding pagdurugo",
  "severe bleeding",
  "hindi makagalaw",
  "hindi makapagsalita",
  "buntis bleeding",
  "overdose",
  "self harm"
];
```

### Emergency Response

```text
EMERGENCY ITO. Tumawag agad sa 911 o pumunta sa pinakamalapit na Emergency Room.
Hindi sapat ang chatbot para sa ganitong sintomas.
```

---

## Frontend Architecture

### Folder Structure

```text
kalusugan-navigator-pwa/
├── public/
│   ├── manifest.webmanifest
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   ├── benefits/
│   │   │   └── BenefitSelector.tsx
│   │   │
│   │   ├── facilities/
│   │   │   ├── FacilityCard.tsx
│   │   │   └── FacilityList.tsx
│   │   │
│   │   ├── safety/
│   │   │   └── EmergencyBanner.tsx
│   │   │
│   │   └── layout/
│   │       ├── AppHeader.tsx
│   │       └── OfflineBanner.tsx
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useSessionId.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── emergency.ts
│   │   └── storage.ts
│   │
│   ├── types/
│   │   ├── chat.ts
│   │   ├── facility.ts
│   │   └── benefits.ts
│   │
│   └── constants/
│       └── app.ts
│
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Frontend State Machine

```ts
export type ChatState =
  | "idle"
  | "asking_symptom"
  | "asking_location"
  | "asking_benefits"
  | "loading"
  | "results"
  | "emergency"
  | "error";
```

### State Flow

```text
idle
  → asking_symptom
  → asking_location
  → asking_benefits
  → loading
  → results

Any state
  → emergency

Any API failure
  → error
```

---

## Frontend TypeScript Contracts

### `types/benefits.ts`

```ts
export type BenefitType =
  | "YAKAP"
  | "PHILHEALTH"
  | "SENIOR"
  | "PWD"
  | "FOUR_PS"
  | "PHILCARE"
  | "NONE";

export type BenefitProfile = {
  hasYakap: boolean;
  hasPhilHealth: boolean;
  isSenior: boolean;
  isPwd: boolean;
  is4ps: boolean;
  hasPhilcare: boolean;
  noBenefits: boolean;
};
```

### `types/facility.ts`

```ts
export type FacilitySource =
  | "YAKAP"
  | "MALASAKIT"
  | "LGU"
  | "OSM"
  | "GOOGLE_MAPS"
  | "PHILCARE_2024";

export type DataReliability = "HIGH" | "MEDIUM" | "LOW";

export type Facility = {
  id?: string;
  name: string;
  address: string;
  distance_km?: number;
  benefit_to_claim?: string;
  what_to_say?: string;
  what_to_bring?: string;
  hours?: string;
  maps_url?: string;
  data_source: FacilitySource;
  data_year?: number;
  data_reliability?: DataReliability;
  is_emergency_capable?: boolean;
};
```

### `types/chat.ts`

```ts
import type { BenefitProfile } from "./benefits";
import type { Facility } from "./facility";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatRequest = {
  session_id: string;
  message: string;
  location?: string;
  benefits?: BenefitProfile;
};

export type ChatResponse = {
  session_id: string;
  state:
    | "idle"
    | "asking_symptom"
    | "asking_location"
    | "asking_benefits"
    | "loading"
    | "results"
    | "emergency"
    | "error";
  reply: string;
  facilities: Facility[];
  is_emergency: boolean;
};
```

---

## PWA Configuration

### `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Nura",
        short_name: "Kalusugan",
        description:
          "Filipino healthcare navigator para sa libreng at abot-kayang serbisyong medikal sa iba-ibang diyalekto at wika.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#F8FAF7",
        theme_color: "#1B6B3A",
        lang: "fil-PH",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/chat"),
            handler: "NetworkFirst",
            options: {
              cacheName: "chat-results-cache",
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## Frontend API Client

### `lib/api.ts`

```ts
import type { ChatRequest, ChatResponse } from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL;

export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Hindi makakonekta sa server ngayon.");
  }

  return response.json() as Promise<ChatResponse>;
}
```

---

## Frontend Components

### `AppHeader.tsx`

Displays:

```text
Nura
Hindi doktor. Gabay sa tamang pasilidad at benepisyo.
```

### `ChatWindow.tsx`

Responsible for:

- Rendering message thread
- Auto-scroll to latest message
- Showing current state UI
- Displaying assistant replies

### `ChatInput.tsx`

Responsible for:

- Text input for symptom/location
- Enter-to-send
- Disabled state while loading
- Preserving typed input during weak connection

### `BenefitSelector.tsx`

Checkboxes:

- PhilHealth / YAKAP
- Senior Citizen
- PWD
- 4Ps
- PhilCare
- Wala / Hindi sure

### `FacilityCard.tsx`

Shows:

- Facility name
- Address
- Distance
- Benefit to claim
- What to bring
- What to say
- Hours, if available
- Google Maps button
- Source badge
- Reliability badge

PhilCare cards must show:

```text
Paalala: Ang PhilCare facility data namin ay mula 2024. Tumawag muna bago pumunta para ma-confirm kung active pa.
```

### `EmergencyBanner.tsx`

Shows a full-width high-contrast alert.

It must appear above the chat result and should not be auto-dismissed.

### `OfflineBanner.tsx`

Shows:

```text
Mahina o walang connection. Ipapakita muna namin ang huling na-save na resulta kung mayroon.
```

---

## Backend Architecture

### Main Backend Responsibilities

FastAPI is responsible for:

1. Validating incoming chat request
2. Running backend emergency detection
3. Managing session state in Firestore
4. Geocoding user location using Google Maps
5. Running structured facility query in Supabase/PostGIS
6. Running RAG query in Supabase/pgvector
7. Calling Gemini Flash with strict system prompt
8. Returning typed response to frontend

---

## Backend API Contract

### `POST /chat`

#### Request

```json
{
  "session_id": "abc123",
  "message": "Masakit mata ko, 3 days na, nasa Quezon City ako.",
  "location": "Quezon City",
  "benefits": {
    "hasYakap": true,
    "hasPhilHealth": true,
    "isSenior": false,
    "isPwd": false,
    "is4ps": false,
    "hasPhilcare": false,
    "noBenefits": false
  }
}
```

#### Response

```json
{
  "session_id": "abc123",
  "state": "results",
  "reply": "Hindi ako doktor, pero matutulungan kitang hanapin kung saan ka pwedeng magpa-check...",
  "facilities": [
    {
      "id": "facility_001",
      "name": "Batasan Hills YAKAP Clinic",
      "address": "Batasan Road, Quezon City",
      "distance_km": 1.2,
      "benefit_to_claim": "PhilHealth YAKAP",
      "what_to_say": "Gusto ko pong magpa-FPE at magpa-empanel sa YAKAP.",
      "what_to_bring": "PhilHealth ID o MDR printout, valid ID",
      "hours": "Mon-Fri 8AM-5PM",
      "maps_url": "https://maps.google.com/?q=14.6869,121.0857",
      "data_source": "YAKAP",
      "data_year": 2025,
      "data_reliability": "HIGH",
      "is_emergency_capable": false
    }
  ],
  "is_emergency": false
}
```

---

## Database Architecture

### `facilities`

```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  source_dataset TEXT NOT NULL,
  data_reliability TEXT NOT NULL,
  verified_date DATE,

  address_full TEXT NOT NULL,
  region TEXT,
  province TEXT,
  city TEXT,
  barangay TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geom GEOGRAPHY(Point, 4326),

  phone TEXT,
  opening_hours TEXT,
  google_place_id TEXT,
  maps_url TEXT,

  accepts_yakap BOOLEAN DEFAULT FALSE,
  has_malasakit BOOLEAN DEFAULT FALSE,
  accepts_philcare BOOLEAN DEFAULT FALSE,
  is_lgu_free BOOLEAN DEFAULT FALSE,
  accepts_senior_discount BOOLEAN DEFAULT TRUE,
  accepts_pwd_discount BOOLEAN DEFAULT TRUE,
  supports_4ps BOOLEAN DEFAULT FALSE,
  has_er BOOLEAN DEFAULT FALSE,

  notes TEXT,
  embedding_text TEXT,
  embedding VECTOR(768)
);
```

### `benefit_guides`

```sql
CREATE TABLE benefit_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_code TEXT NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT,
  source_date DATE,
  reliability TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(768)
);
```

### `conversation_sessions`

```sql
CREATE TABLE conversation_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  current_state TEXT NOT NULL,
  symptom_text TEXT,
  symptom_category TEXT,
  urgency_level TEXT,

  user_city TEXT,
  user_barangay TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,

  has_yakap BOOLEAN DEFAULT FALSE,
  has_philhealth BOOLEAN DEFAULT FALSE,
  is_senior BOOLEAN DEFAULT FALSE,
  is_pwd BOOLEAN DEFAULT FALSE,
  is_4ps BOOLEAN DEFAULT FALSE,
  has_philcare BOOLEAN DEFAULT FALSE,
  wants_public_only BOOLEAN DEFAULT FALSE,

  last_response JSONB
);
```

---

## Facility Search Logic

```sql
SELECT *
FROM facilities
WHERE ST_DWithin(
  geom,
  ST_MakePoint(:lng, :lat)::geography,
  :radius_meters
)
AND (
  (:has_yakap = true AND accepts_yakap = true)
  OR (:has_philcare = true AND accepts_philcare = true)
  OR (:no_benefits = true AND is_lgu_free = true)
  OR (:needs_er = true AND has_er = true)
)
ORDER BY
  CASE data_reliability
    WHEN 'HIGH' THEN 1
    WHEN 'MEDIUM' THEN 2
    ELSE 3
  END,
  ST_Distance(geom, ST_MakePoint(:lng, :lat)::geography) ASC
LIMIT 5;
```

---

## RAG Knowledge Base

### Required Guides

- YAKAP guide
- Malasakit guide
- Senior Citizen guide
- PWD guide
- 4Ps guide
- PhilCare guide
- LGU free primary care guide
- Emergency guidance guide

### Chunking Rule

Each guide should be chunked by practical action:

- What is this benefit?
- Who can use it?
- Where can it be used?
- What should the user bring?
- What should the user say?
- What are the limitations?

---

## Gemini System Prompt

```text
You are Nura, a healthcare access and benefits navigation assistant for users in the Philippines.

You are NOT a doctor.
You must NOT diagnose diseases.
You must NOT prescribe medicine.
You must NOT say the user has a specific condition.
You must NOT replace professional medical advice.

Your job is only to:
1. Help the user understand where they can seek care.
2. Match the user to nearby verified facilities.
3. Explain which benefit may apply, such as YAKAP, Malasakit, Senior Citizen, PWD, 4Ps, PhilCare, or LGU free care.
4. Explain what documents to bring.
5. Explain what to say at the front desk in simple language that matches the user's dialect when possible.
6. Recommend emergency care when the system marks the case as urgent.

You must only use the facility records and knowledge chunks provided in the context.
If the answer is not in the provided context, say:
"Hindi ko ito ma-verify sa available data namin ngayon."

Always respond in the user's dialect/language when clearly detected.
If the dialect/language is unclear, use simple Filipino.
If the user uses pure English, respond in English.

For symptoms:
- Summarize only.
- Categorize only.
- Do not diagnose.
- Use phrases like "pwedeng ipa-check," "mas mabuting magpakonsulta," and "hindi ito diagnosis."

For emergency cases:
- Start with: "EMERGENCY ITO."
- Tell the user to call 911 or go to the nearest ER.
- Do not provide normal clinic navigation as the main answer.

For PhilCare facilities:
- Always include the disclaimer:
"Paalala: Ang PhilCare facility data namin ay mula 2024. Tumawag muna bago pumunta para ma-confirm kung active pa."

Output format:
1. Safety disclaimer
2. Short understanding of user concern
3. Recommended facility list
4. Benefit to use
5. What to bring
6. What to say
7. Important reminders
```

---

## Offline Behavior

| Scenario | Behavior |
|---|---|
| Full connectivity | Normal API calls |
| Weak connection | Show banner, keep typed input, retry request |
| Dropped mid-conversation | Firestore session persists; user can resume |
| Fully offline with cached result | Show last facility result and instructions |
| First load offline | Show shell and emergency reminder only |

Offline fallback message:

```text
Kailangan ng internet para makahanap ng updated facility.
Kung emergency ito, tumawag sa 911 o pumunta sa pinakamalapit na ER.
```

---

## UI / UX Direction

The UI should feel like a **public-service navigator**, not a flashy AI app.

### Use

- Warm white background
- Deep green primary color
- Soft blue/teal secondary accents
- Large readable text
- Big buttons
- High-contrast emergency banner
- Simple facility cards
- Minimal icons

### Avoid

- Too many icons
- Glassmorphism
- Neon colors
- Tiny text
- Complicated dashboards
- AI gimmick visuals
- Heavy animations

---

## Deployment

### Frontend

```bash
npm install
npm run build
firebase deploy --only hosting
```

### Frontend Environment

```env
VITE_API_URL=https://kalusugan-api-xxxxx.a.run.app
```

### Backend

Deploy FastAPI to Cloud Run.

```bash
gcloud run deploy kalusugan-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

## Demo Script

### Demo 1: Normal YAKAP Flow

Input:

```text
Masakit mata ko, 3 days na, nasa Quezon City ako. May PhilHealth ako.
```

Expected output:

- No emergency
- Ask/confirm benefits
- Show nearby YAKAP or public health facility
- Explain what to bring
- Show front-desk script
- Show Google Maps link

### Demo 2: No Benefits Flow

Input:

```text
Wala akong PhilHealth, masakit tiyan ko, nasa Manila ako.
```

Expected output:

- Recommend LGU/public health center
- Explain free or low-cost primary care path
- Suggest PhilHealth/YAKAP registration as follow-up

### Demo 3: Emergency Flow

Input:

```text
Hirap akong huminga at masakit dibdib ko.
```

Expected output:

- Immediate emergency warning
- No normal RAG answer
- Nearest ER/hospital if available

### Demo 4: PhilCare Flow

Input:

```text
May PhilCare ako, nasa Makati ako.
```

Expected output:

- Show PhilCare facility if available
- Display 2024 data disclaimer
- Suggest calling first before going

---

## Hackathon Build Order

### Phase 1: Frontend Shell

- Vite + React + TypeScript setup
- PWA plugin
- App header
- Chat window
- Offline banner
- Emergency banner

### Phase 2: Backend Contract

- Define `/chat` contract
- Mock response first
- Connect frontend to mock backend

### Phase 3: Facility Result UI

- Facility cards
- Maps links
- Source badges
- Reliability badges
- PhilCare disclaimer

### Phase 4: Real Backend Integration

- Supabase facility query
- Google Maps geocoding
- pgvector retrieval
- Gemini response synthesis

### Phase 5: Demo Polish

- Test 3 fixed demo scenarios
- Prepare fallback data
- Prepare screenshots in case internet fails
- Freeze features before submission

---

## Final Build Principle

Build the smallest version that proves the strongest claim:

> A Filipino user can describe a health concern in their own dialect/language and immediately receive a safe, practical, benefit-aware route to care.

If a feature does not support that claim, cut it.
