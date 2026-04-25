import os
import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")

from fastapi.testclient import TestClient

from dependencies import get_chat_orchestrator
from main import create_app
from models.chat import ServiceResult
from models.session import SessionState
from services.interfaces import InferenceResult
from services.orchestrator import ChatOrchestrator


class InMemorySessionRepository:
    def __init__(self, session: SessionState) -> None:
        self.session = session

    def get_session(self, session_id: UUID) -> SessionState | None:
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
        if self.session.id != session_id:
            return self.session

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


class StubHospitalService:
    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        city = session.location_city or "Unknown"
        return ServiceResult(
            response_type="RECOMMENDATION",
            message=f"Hospital recommendations for {city}",
            data={"source": "endpoint-test-hospital"},
        )


class StubAIRagService:
    def answer(self, session: SessionState, message: str) -> ServiceResult:
        return ServiceResult(
            response_type="RAG_ANSWER",
            message="Endpoint test RAG answer",
            data={"source": "endpoint-test-rag"},
        )


class StubInferenceService:
    def __init__(self, result: InferenceResult) -> None:
        self.result = result

    def infer(self, session: SessionState, message: str) -> InferenceResult:
        return self.result


def build_session(location_city: str | None = None, benefits: list[str] | None = None) -> SessionState:
    now = datetime.now(timezone.utc)
    return SessionState(
        id=uuid4(),
        language="en",
        location_city=location_city,
        benefits=benefits or [],
        conversation_history=[],
        created_at=now,
        updated_at=now,
        expires_at=now + timedelta(minutes=60),
    )


class ChatEndpointTests(unittest.TestCase):
    def test_chat_endpoint_returns_follow_up_for_missing_fields(self) -> None:
        session = build_session(location_city=None, benefits=[])
        orchestrator = ChatOrchestrator(
            session_repository=InMemorySessionRepository(session),
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=StubHospitalService(),
            ai_rag_service=StubAIRagService(),
            session_ttl_minutes=60,
        )
        app = create_app()
        app.dependency_overrides[get_chat_orchestrator] = lambda: orchestrator
        client = TestClient(app)

        response = client.post(
            "/api/v1/chat",
            json={"session_id": str(session.id), "message": "Can you help me?"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["response_type"], "FOLLOW_UP")
        self.assertEqual(payload["missing_fields"], ["location_city", "benefits"])

    def test_chat_endpoint_routes_with_llm_inference(self) -> None:
        session = build_session(location_city=None, benefits=[])
        orchestrator = ChatOrchestrator(
            session_repository=InMemorySessionRepository(session),
            emergency_classifier=StubEmergencyClassifier([]),
            hospital_service=StubHospitalService(),
            ai_rag_service=StubAIRagService(),
            session_ttl_minutes=60,
            inference_service=StubInferenceService(
                InferenceResult(
                    intent="HOSPITAL",
                    location_city="Davao City",
                    benefits=["PhilHealth"],
                    source="llm",
                )
            ),
        )
        app = create_app()
        app.dependency_overrides[get_chat_orchestrator] = lambda: orchestrator
        client = TestClient(app)

        response = client.post(
            "/api/v1/chat",
            json={"session_id": str(session.id), "message": "Where can I go today?"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["response_type"], "RECOMMENDATION")
        self.assertEqual(payload["data"]["intent"], "HOSPITAL")
        self.assertEqual(payload["data"]["routing_meta"]["intent_source"], "llm")
        self.assertEqual(payload["data"]["routing_meta"]["inference_source"], "llm")


if __name__ == "__main__":
    unittest.main()
