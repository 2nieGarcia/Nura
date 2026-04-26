from datetime import datetime, timedelta, timezone
from uuid import uuid4
import unittest

from models.session import SessionState
from services.ai_rag_service import MockAIRagService
from services.hospital_service import MockHospitalService


def build_session(*, language: str = "en") -> SessionState:
    now = datetime.now(timezone.utc)
    return SessionState(
        id=uuid4(),
        language=language,
        location_city="Quezon City",
        benefits=["PhilHealth"],
        conversation_history=[],
        created_at=now,
        updated_at=now,
        expires_at=now + timedelta(minutes=60),
    )


class IntegratedServiceFallbackTests(unittest.TestCase):
    def test_rag_fallback_keeps_disclaimer_and_contract_shape(self) -> None:
        service = MockAIRagService()

        result = service.answer(
            build_session(language="en"),
            "What does PhilHealth cover for consultation?",
        )

        self.assertEqual(result.response_type, "RAG_ANSWER")
        self.assertIn("not a doctor", result.message.lower())
        self.assertEqual(result.data["source"], "rag-fallback-service")
        self.assertEqual(result.data["retrieval"]["source"], "disabled")

    def test_hospital_fallback_returns_facilities_and_hospitals_alias(self) -> None:
        service = MockHospitalService()

        result = service.recommend(build_session(language="fil"), "Masakit ulo")

        self.assertEqual(result.response_type, "RECOMMENDATION")
        self.assertIn("Hindi ako doktor", result.message)
        self.assertGreater(len(result.data["facilities"]), 0)
        self.assertIs(result.data["facilities"], result.data["hospitals"])
        self.assertIn("name", result.data["facilities"][0])
        self.assertIn("address", result.data["facilities"][0])


if __name__ == "__main__":
    unittest.main()
