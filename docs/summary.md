---
title: Nura — Filipino Healthcare Access Navigator
tagline: A multilingual chatbot that tells Filipinos which nearby facility to visit, which benefit to claim, and what to bring.
area: ml
stack: [FastAPI, React, Gemini, Supabase pgvector, Vertex AI]
note: Shipped in 24 hours; works in 5 languages and catches 32 emergency phrases before any AI call
---

Most Filipinos know free or subsidized care exists, like PhilHealth YAKAP, Malasakit Centers, and senior and persons with disabilities (PWD) discounts. The rules are scattered, though, and nobody tells you where to actually go or what to bring. Nura answers that, and it never diagnoses or prescribes.

I led our four-person team at InnOlympics 2026 and owned the system design and backend orchestration. I set up the FastAPI backend and wrote the chat orchestrator every message goes through: emergency check first, then a gate that asks for anything missing, then routing to facility search or benefit answers. I also handled integration and release. My teammates built the facility data pipeline, the retrieval-augmented generation (RAG) layer, and the React frontend.

You describe your concern in Filipino, Cebuano, Ilocano, Hiligaynon or English, then pick your city and any of six benefit programs. Nura returns the top facility with a map, the documents to bring, and the line to say at the front desk. Benefit answers come from PhilHealth guides retrieved with pgvector and written up by Gemini.

We shipped it in 24 hours. Safety came first: a deterministic check against 32 emergency phrases in Filipino, Cebuano and English runs before any session lookup, model call or search, and sends you straight to 911. If there's no verified facility for your city, Nura says so instead of making one up. All 15 backend tests pass, and as an offline-ready progressive web app (PWA), your last care pass opens with no signal.
