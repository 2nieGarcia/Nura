from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
import unittest

from db.session_repository import SessionNotFoundError
from models.chat import ChatRequest, ServiceResult
from models.session import SessionState
from services.orchestrator import ChatOrchestrator, SessionExpiredError


class InMemorySessionRepository:
    def __init__(self, session: SessionState | None) -> None:
        self.session = session
        self.get_calls = 0
        self.update_calls = 0

    def get_session(self, session_id: UUID) -> SessionState | None:
        self.get_calls += 1
        if self.session is None:
            return None
        if self.session.id != session_id:
            return None
        return self.session

    def update_session(
        self,
        session_id: UUID,
        fields: dict[str, object] | None = None,
        append_messages: list[dict[str, object]] | None = None,
        ttl_minutes: int | None = None,
    ) -> SessionState:
        self.update_calls += 1
        if self.session is None or self.session.id != session_id:
            raise SessionNotFoundError(f"Session {session_id} does not exist.")

        if fields:
            for key, value in fields.items():
                setattr(self.session, key, value)

        if append_messages:
            self.session.conversation_history.extend(append_messages)

        if ttl_minutes is not None:
            self.session.expires_at = datetime.now(timezone.utc) + timedelta(
                minutes=ttl_minutes
            )

        return self.session


class StubEmergencyClassifier:
    def __init__(self, matches: list[str]) -> None:
        self.matches = matches

    def matched_keywords(self, message: str) -> list[str]:
        return self.matches


class SpyHospitalService:
    def __init__(self) -> None:
        self.called = False

    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        self.called = True
        return ServiceResult(
            response_type="RECOMMENDATION",
            message="Hospital recommendation",
            data={"source": "test-hospital-service"},
        )


class SpyAIRagService:
    def __init__(self) -> None:
        self.called = False

    def answer(self, session: SessionState, message: str) -> ServiceResult:
        self.called = True
        return ServiceResult(
            response_type="RAG_ANSWER",
            message="RAG answer",
            data={"source": "test-ai-rag-service"},
        )


def build_session(
    *,
    location_city: str | None,
    benefits: list[str],
    expires_delta_minutes: int = 60,
) -> SessionState:
    now = datetime.now(timezone.utc)
    return SessionState(
        id=uuid4(),
        language="en",
        location_city=location_city,
        benefits=benefits,
        conversation_history=[],
        created_at=now,
        updated_at=now,
        expires_at=now + timedelta(minutes=expires_delta_minutes),
    )


class ChatOrchestratorTests(unittest.TestCase):
    def test_emergency_response_short_circuits_before_session_lookup(self) -> None:
        session = build_session(location_city="Cebu", benefits=["PhilHealth"])
        repository = InMemorySessionRepository(session)
        hospital_service = SpyHospitalService()
        ai_rag_service = SpyAIRagService()
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier(["stroke"]),
            hospital_service=hospital_service,
            ai_rag_service=ai_rag_service,
            session_ttl_minutes=60,
        )

        response = orchestrator.handle_chat(
            ChatRequest(session_id=session.id, message="Possible stroke now")
        )

        self.assertEqual(response.response_type, "EMERGENCY")
        self.assertEqual(response.data["matched_keywords"], ["stroke"])
        self.assertEqual(repository.get_calls, 0)
        self.assertEqual(repository.update_calls, 0)
        self.assertFalse(hospital_service.called)
        self.assertFalse(ai_rag_service.called)

    def test_follow_up_when_city_and_benefits_missing(self) -> None:
        session = build_session(location_city=None, benefits=[])
        repository = InMemorySessionRepository(session)
        hospital_service = SpyHospitalService()
        ai_rag_service = SpyAIRagService()
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=hospital_service,
            ai_rag_service=ai_rag_service,
            session_ttl_minutes=60,
        )

        response = orchestrator.handle_chat(
            ChatRequest(session_id=session.id, message="I need help with my benefits")
        )

        self.assertEqual(response.response_type, "FOLLOW_UP")
        self.assertEqual(response.missing_fields, ["location_city", "benefits"])
        self.assertIn("What city are you currently in?", response.message)
        self.assertIn("What benefits or memberships do you have", response.message)
        self.assertEqual(len(session.conversation_history), 2)
        self.assertEqual(session.conversation_history[0]["role"], "user")
        self.assertEqual(session.conversation_history[1]["role"], "assistant")
        self.assertFalse(hospital_service.called)
        self.assertFalse(ai_rag_service.called)

    def test_routes_to_hospital_service_for_hospital_intent(self) -> None:
        session = build_session(location_city="Cebu", benefits=["PhilHealth"])
        repository = InMemorySessionRepository(session)
        hospital_service = SpyHospitalService()
        ai_rag_service = SpyAIRagService()
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=hospital_service,
            ai_rag_service=ai_rag_service,
            session_ttl_minutes=60,
        )

        response = orchestrator.handle_chat(
            ChatRequest(session_id=session.id, message="What is the nearest hospital?")
        )

        self.assertEqual(response.response_type, "RECOMMENDATION")
        self.assertEqual(response.data["intent"], "HOSPITAL")
        self.assertTrue(hospital_service.called)
        self.assertFalse(ai_rag_service.called)
        self.assertEqual(session.conversation_history[-1]["content"], "Hospital recommendation")

    def test_routes_to_rag_service_by_default(self) -> None:
        session = build_session(location_city="Cebu", benefits=["PhilHealth"])
        repository = InMemorySessionRepository(session)
        hospital_service = SpyHospitalService()
        ai_rag_service = SpyAIRagService()
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=hospital_service,
            ai_rag_service=ai_rag_service,
            session_ttl_minutes=60,
        )

        response = orchestrator.handle_chat(
            ChatRequest(
                session_id=session.id,
                message="What does PhilHealth usually cover for consultations?",
            )
        )

        self.assertEqual(response.response_type, "RAG_ANSWER")
        self.assertEqual(response.data["intent"], "RAG")
        self.assertFalse(hospital_service.called)
        self.assertTrue(ai_rag_service.called)
        self.assertEqual(session.conversation_history[-1]["content"], "RAG answer")

    def test_raises_when_session_not_found(self) -> None:
        session_id = uuid4()
        repository = InMemorySessionRepository(None)
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=SpyHospitalService(),
            ai_rag_service=SpyAIRagService(),
            session_ttl_minutes=60,
        )

        with self.assertRaises(SessionNotFoundError):
            orchestrator.handle_chat(ChatRequest(session_id=session_id, message="hello"))

    def test_raises_when_session_expired(self) -> None:
        session = build_session(
            location_city="Cebu",
            benefits=["PhilHealth"],
            expires_delta_minutes=-1,
        )
        repository = InMemorySessionRepository(session)
        orchestrator = ChatOrchestrator(
            session_repository=repository,
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=SpyHospitalService(),
            ai_rag_service=SpyAIRagService(),
            session_ttl_minutes=60,
        )

        with self.assertRaises(SessionExpiredError):
            orchestrator.handle_chat(ChatRequest(session_id=session.id, message="hello"))


if __name__ == "__main__":
    unittest.main()
