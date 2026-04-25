import re

from db.session_repository import SessionNotFoundError, SessionRepository
from models.chat import ChatRequest, ChatResponse
from models.session import SessionState
from services.interfaces import (
    AIRagService,
    EmergencyClassifier,
    HospitalService,
    InferenceResult,
    OrchestratorInferenceService,
)


class SessionExpiredError(Exception):
    pass


class ChatOrchestrator:
    _BENEFIT_KEYWORDS: dict[str, tuple[str, ...]] = {
        "PhilHealth": ("philhealth", "phil health"),
        "Senior Citizen": ("senior citizen", "senior"),
        "PWD": ("pwd", "person with disability", "disability id"),
        "4Ps": ("4ps", "pantawid"),
        "HMO": ("hmo", "health card", "maxicare", "medicard", "intellicare"),
        "Private Insurance": ("insurance", "insured"),
    }
    _NO_BENEFIT_TOKENS: tuple[str, ...] = (
        "no benefit",
        "no benefits",
        "no insurance",
        "not insured",
        "none",
        "wala",
        "walang",
    )
    _HOSPITAL_TOKENS: tuple[str, ...] = (
        "hospital",
        "nearest",
        "near me",
        "city hospital",
        "clinic",
        "where can i go",
        "saan",
        "asa",
    )
    _RAG_TOKENS: tuple[str, ...] = (
        "benefit",
        "benefits",
        "coverage",
        "covered",
        "cover",
        "claim",
        "requirements",
        "eligible",
        "eligibility",
        "philhealth",
        "membership",
    )
    _LOCATION_PATTERNS: tuple[re.Pattern[str], ...] = (
        re.compile(
            r"\b(?:i am in|i'm in|im in|currently in|located in|living in|from)\s+(?P<city>[a-z][a-z\s\-]{1,50})"
        ),
        re.compile(r"\b(?:nasa|taga)\s+(?P<city>[a-z][a-z\s\-]{1,50})"),
        re.compile(
            r"^(?:sa|asa)\s+(?P<city>[a-z][a-z\s\-]{1,50})(?:\s+(?:ako|po))?$"
        ),
    )

    def __init__(
        self,
        session_repository: SessionRepository,
        emergency_classifier: EmergencyClassifier,
        hospital_service: HospitalService,
        ai_rag_service: AIRagService,
        session_ttl_minutes: int,
        inference_service: OrchestratorInferenceService | None = None,
    ) -> None:
        self.session_repository = session_repository
        self.emergency_classifier = emergency_classifier
        self.hospital_service = hospital_service
        self.ai_rag_service = ai_rag_service
        self.session_ttl_minutes = session_ttl_minutes
        self.inference_service = inference_service

    def handle_chat(self, request: ChatRequest) -> ChatResponse:
        # Step 1: Emergency check (immediate return if keyword match).
        matched = self.emergency_classifier.matched_keywords(request.message)
        if matched:
            return ChatResponse(
                session_id=request.session_id,
                response_type="EMERGENCY",
                message=(
                    "Emergency keywords detected. Please contact emergency services or go "
                    "to the nearest ER immediately."
                ),
                data={
                    "matched_keywords": matched,
                    "disclaimer": (
                        "Keyword detection is deterministic and not a clinical triage assessment."
                    ),
                },
            )

        # Step 2: Retrieve and update session state.
        session = self.session_repository.get_session(request.session_id)
        if session is None:
            raise SessionNotFoundError(f"Session {request.session_id} was not found.")
        if session.is_expired:
            raise SessionExpiredError(f"Session {request.session_id} has expired.")

        inference_result = self._infer_with_service(session, request.message)
        fields_to_update = self._build_fields_to_update(session, request, inference_result)

        session = self.session_repository.update_session(
            session_id=request.session_id,
            fields=fields_to_update,
            append_messages=[{"role": "user", "content": request.message}],
            ttl_minutes=self.session_ttl_minutes,
        )

        # Step 3: Missing info gate.
        missing_fields = self._get_missing_fields(session)
        if missing_fields:
            follow_up_message = self._build_follow_up_message(missing_fields)
            session = self.session_repository.update_session(
                session_id=request.session_id,
                append_messages=[{"role": "assistant", "content": follow_up_message}],
                ttl_minutes=self.session_ttl_minutes,
            )
            return ChatResponse(
                session_id=session.id,
                response_type="FOLLOW_UP",
                message=follow_up_message,
                missing_fields=missing_fields,
                data={"session": self._session_view(session)},
            )

        # Step 4: Route to HospitalService or AIRagService by intent.
        intent, intent_source = self._resolve_intent(request, inference_result)
        if intent == "HOSPITAL":
            result = self.hospital_service.recommend(session, request.message)
        else:
            result = self.ai_rag_service.answer(session, request.message)

        session = self.session_repository.update_session(
            session_id=request.session_id,
            append_messages=[{"role": "assistant", "content": result.message}],
            ttl_minutes=self.session_ttl_minutes,
        )

        return ChatResponse(
            session_id=session.id,
            response_type=result.response_type,
            message=result.message,
            data={
                **result.data,
                "intent": intent,
                "routing_meta": self._routing_meta(
                    inference_result=inference_result,
                    intent_source=intent_source,
                ),
                "session": self._session_view(session),
            },
        )

    def _infer_with_service(self, session: SessionState, message: str) -> InferenceResult:
        if self.inference_service is None:
            return InferenceResult(source="disabled")
        return self.inference_service.infer(session, message)

    def _resolve_intent(
        self,
        request: ChatRequest,
        inference_result: InferenceResult,
    ) -> tuple[str, str]:
        if request.intent is not None:
            return request.intent, "request"
        if inference_result.intent is not None:
            return inference_result.intent, "llm"
        return self._infer_intent(request.message), "rules"

    def _routing_meta(
        self,
        inference_result: InferenceResult,
        intent_source: str,
    ) -> dict[str, str]:
        routing_meta = {
            "intent_source": intent_source,
            "inference_source": inference_result.source,
        }
        if inference_result.error:
            routing_meta["inference_error"] = inference_result.error
        return routing_meta

    def _get_missing_fields(self, session: SessionState) -> list[str]:
        missing: list[str] = []
        if not session.location_city:
            missing.append("location_city")
        if not session.benefits:
            missing.append("benefits")
        return missing

    def _build_follow_up_message(self, missing_fields: list[str]) -> str:
        prompts = {
            "location_city": "What city are you currently in?",
            "benefits": "What benefits or memberships do you have (e.g., PhilHealth)?",
        }
        followups = [prompts[field] for field in missing_fields if field in prompts]
        return "I need a bit more information before I can help: " + " ".join(followups)

    def _infer_intent(self, message: str) -> str:
        normalized = message.lower()
        hospital_score = sum(token in normalized for token in self._HOSPITAL_TOKENS)
        rag_score = sum(token in normalized for token in self._RAG_TOKENS)

        if hospital_score > rag_score:
            return "HOSPITAL"
        return "RAG"

    def _session_view(self, session: SessionState) -> dict[str, object]:
        return {
            "id": str(session.id),
            "language": session.language,
            "location_city": session.location_city,
            "benefits": session.benefits,
            "expires_at": session.expires_at.isoformat() if session.expires_at else None,
        }

    def _build_fields_to_update(
        self,
        session: SessionState,
        request: ChatRequest,
        inference_result: InferenceResult,
    ) -> dict[str, object]:
        fields_to_update: dict[str, object] = {}

        if request.language is not None:
            language = request.language.strip()
            if language:
                fields_to_update["language"] = language

        if request.location_city is not None:
            city = self._normalize_city(request.location_city)
            if city:
                fields_to_update["location_city"] = city
        elif not session.location_city:
            city = self._normalize_city(inference_result.location_city or "")
            if city:
                fields_to_update["location_city"] = city
                fields_to_update["location_raw"] = request.message
            else:
                city = self._extract_location_city(request.message)
            if city:
                fields_to_update["location_city"] = city
                fields_to_update["location_raw"] = request.message

        if request.benefits is not None:
            fields_to_update["benefits"] = self._normalize_benefits(request.benefits)
        elif not session.benefits:
            inferred_benefits = self._normalize_benefits(inference_result.benefits)
            if not inferred_benefits:
                inferred_benefits = self._extract_benefits(request.message)
            if inferred_benefits:
                fields_to_update["benefits"] = inferred_benefits

        return fields_to_update

    def _normalize_city(self, location_city: str) -> str | None:
        cleaned = self._clean_location_candidate(location_city)
        if cleaned is None:
            return None
        return cleaned

    def _extract_location_city(self, message: str) -> str | None:
        normalized = message.lower().strip()
        if not normalized:
            return None

        for pattern in self._LOCATION_PATTERNS:
            match = pattern.search(normalized)
            if match is None:
                continue
            candidate = self._clean_location_candidate(match.group("city"))
            if candidate:
                return candidate
        return None

    def _clean_location_candidate(self, value: str) -> str | None:
        candidate = value.strip().lower()
        if not candidate:
            return None

        candidate = re.split(r"[,.!?;]", candidate, maxsplit=1)[0].strip()
        candidate = re.split(r"\b(?:and|with|pero|kasi|because)\b", candidate, maxsplit=1)[
            0
        ].strip()
        candidate = re.sub(r"\s+", " ", candidate).strip(" -")
        candidate = re.sub(r"^(?:the|city of)\s+", "", candidate).strip()
        if not candidate:
            return None

        invalid_single_words = {
            "pain",
            "help",
            "benefits",
            "benefit",
            "philhealth",
            "hospital",
            "emergency",
            "urgent",
        }
        tokens = candidate.split(" ")
        if len(tokens) == 1 and tokens[0] in invalid_single_words:
            return None
        if len(tokens) > 5:
            return None

        return candidate.title()

    def _normalize_benefits(self, benefits: list[str]) -> list[str]:
        deduped: list[str] = []
        seen: set[str] = set()
        for raw in benefits:
            normalized = self._canonicalize_benefit(raw)
            if normalized is None:
                continue
            key = normalized.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(normalized)
        return deduped

    def _extract_benefits(self, message: str) -> list[str]:
        normalized = message.lower()
        extracted: list[str] = []

        for canonical, keywords in self._BENEFIT_KEYWORDS.items():
            if any(keyword in normalized for keyword in keywords):
                extracted.append(canonical)

        if extracted:
            return extracted

        if any(token in normalized for token in self._NO_BENEFIT_TOKENS):
            return ["No Declared Benefits"]

        return []

    def _canonicalize_benefit(self, value: str) -> str | None:
        normalized = value.strip().lower()
        if not normalized:
            return None

        for canonical, keywords in self._BENEFIT_KEYWORDS.items():
            if normalized == canonical.lower() or any(
                keyword in normalized for keyword in keywords
            ):
                return canonical

        if any(token in normalized for token in self._NO_BENEFIT_TOKENS):
            return "No Declared Benefits"

        return value.strip()
