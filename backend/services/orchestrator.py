from db.session_repository import SessionNotFoundError, SessionRepository
from models.chat import ChatRequest, ChatResponse
from models.session import SessionState
from services.interfaces import AIRagService, EmergencyClassifier, HospitalService


class SessionExpiredError(Exception):
    pass


class ChatOrchestrator:
    def __init__(
        self,
        session_repository: SessionRepository,
        emergency_classifier: EmergencyClassifier,
        hospital_service: HospitalService,
        ai_rag_service: AIRagService,
        session_ttl_minutes: int,
    ) -> None:
        self.session_repository = session_repository
        self.emergency_classifier = emergency_classifier
        self.hospital_service = hospital_service
        self.ai_rag_service = ai_rag_service
        self.session_ttl_minutes = session_ttl_minutes

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

        fields_to_update: dict[str, object] = {}
        if request.language is not None:
            fields_to_update["language"] = request.language
        if request.location_city is not None:
            fields_to_update["location_city"] = request.location_city
        if request.benefits is not None:
            fields_to_update["benefits"] = request.benefits

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
        intent = request.intent or self._infer_intent(request.message)
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
            data={**result.data, "intent": intent, "session": self._session_view(session)},
        )

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
        hospital_tokens = [
            "hospital",
            "nearest",
            "near me",
            "city hospital",
            "clinic",
            "where can i go",
            "saan",
            "asa",
        ]
        if any(token in normalized for token in hospital_tokens):
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
