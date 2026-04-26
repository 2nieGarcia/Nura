# New Features And Fixes

This document summarizes the new demo-ready Nura improvements added in the latest feature push.

## UI/UX Improvements

- Redesigned the mobile-first app shell and header so the logo, title, language selector, theme toggle, New Chat, and Last Pass controls no longer crowd each other.
- Improved chat message layout with tighter spacing, more consistent bubble widths, cleaner typography, and better dark-mode contrast.
- Reworked quick-reply symptom chips so they wrap cleanly and stay large enough for touch input.
- Reduced and integrated the sticky bottom input bar so it uses less screen space while keeping voice and send actions accessible.
- Added better empty, loading, offline, and Last Care Pass states.
- Improved dark and light theme tokens for a calmer healthcare assistant look.
- Fixed recommendation map rendering so facility cards can show a map from coordinates, a maps URL, or facility name plus address.

## Chatbot And LLM Logic Improvements

- Added a `concern` field to the chat request flow so later turns like city selection or benefit selection do not replace the original symptom/concern.
- Strengthened the response format contract so generated answers follow predictable sections:
  - Explanation
  - Where to go
  - What to bring
  - What to say
- Updated prompts to avoid diagnosis, prescriptions, triage claims, or invented facility details.
- Added safer language handling for Auto, Filipino/Tagalog, Cebuano/Bisaya, Ilocano, Hiligaynon, and English.
- Added structured fallback responses when Gemini, translation, RAG, or facility lookup fails.
- Improved conversation state handling for repeated inputs, follow-up questions, language changes, and restored conversations.

## Facility Search Improvements

- Removed unsafe broad facility fallback behavior that reused unrelated rows when a selected city was not present in the database.
- Facility search now returns only exact or fuzzy city matches from real database rows.
- If no verified facility exists for the selected city, Nura now says so clearly instead of showing an unrelated hospital.
- Added a Maps search action for no-result cases so users can still search hospitals in their selected city and confirm with the LGU health office or PhilHealth desk.
- Facility recommendations now include source and reliability metadata in the LLM context.

## Emergency Handling

- Confirmed backend emergency detection short-circuits before session lookup, LLM calls, RAG retrieval, or facility search.
- Expanded backend emergency keyword coverage for realistic Filipino and English phrases such as difficulty breathing, chest pain, unconsciousness, severe bleeding, overdose, and self-harm.
- Improved keyword matching to use phrase boundaries instead of loose substring checks.
- Emergency responses continue to route users to 911 or the nearest ER instead of chatbot guidance.

## Offline And Care Pass

- Preserved Offline Last Care Pass support.
- Last Pass now has a clear empty state when no saved pass exists.
- Connection-failure fallback can surface the latest saved pass when available.

## Verification

- Backend tests pass with coverage for facility city mismatch, no-fabricated-facility fallback, original concern preservation, and emergency short-circuit behavior.
- Frontend production build passes.
- Modified backend Python modules compile successfully.
