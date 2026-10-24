---
title: Nura — Filipino Healthcare Access Navigator
tagline: A multilingual chatbot that tells Filipinos which nearby facility to visit, which benefit to claim, and what to bring.
area: ml
stack: [FastAPI, React, Gemini, Supabase pgvector, Vertex AI]
note: InnOlympics 2026 hackathon, 4-person team
---

Most Filipinos know free or subsidized care exists, like PhilHealth YAKAP, Malasakit Centers, and senior and persons with disabilities (PWD) discounts. The rules are scattered, though, and nobody tells you where to actually go or what to bring. Nura answers exactly that, and on purpose it isn't a doctor: it never diagnoses or prescribes.

We built it for InnOlympics 2026 in the Pangarap sa Kalusugan track as a four-person team. I was the project lead: I designed the architecture, wrote the FastAPI backend orchestration, and handled integration and release. My teammates owned the facility data pipeline, the retrieval-augmented generation (RAG) layer, and the React frontend.

You describe your concern in Filipino, Cebuano, Ilocano, Hiligaynon or English, then pick your city and benefits. Nura returns the top facility with a map, the documents to bring, and the exact line to say at the front desk. Benefit answers come from PhilHealth guides retrieved with pgvector and written up by Gemini.

The rule I cared most about is safety. A deterministic keyword check for emergencies like chest pain or trouble breathing runs before any session lookup, model call or search, and sends you straight to 911. It's also an offline-ready progressive web app (PWA), so your last care pass still opens with no signal.
