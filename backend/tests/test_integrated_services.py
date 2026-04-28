from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4
import unittest

from models.session import SessionState
from services.ai_rag_service import MockAIRagService
from services.emergency_classifier import KeywordEmergencyClassifier
from services.hospital_service import MockHospitalService, SupabaseHealthFacilitySearch


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

    def test_hospital_fallback_does_not_fabricate_facilities(self) -> None:
        service = MockHospitalService()

        result = service.recommend(build_session(language="fil"), "Masakit ulo")

        self.assertEqual(result.response_type, "RECOMMENDATION")
        self.assertIn("Hindi ako doktor", result.message)
        self.assertEqual(result.data["facilities"], [])
        self.assertIs(result.data["facilities"], result.data["hospitals"])
        self.assertEqual(result.data["llm"]["source"], "skipped")
        self.assertEqual(result.data["llm"]["error"], "no_verified_facilities")

    def test_facility_search_does_not_reuse_unrelated_city_candidates(self) -> None:
        search = SupabaseHealthFacilitySearch(
            supabase_url="https://example.supabase.co",
            supabase_key="service-role",
            table_name="health_facilities",
            default_region="",
            max_candidates=10,
            fuzzy_threshold=80,
        )
        search._fetch_candidates = lambda **_: [
            {
                "id": "1",
                "name_of_health_facility": "Assumpta Family Hospital",
                "street": "Magallanes St.",
                "municipality_city": "Bangued",
                "region": "Ilocos",
                "is_philhealth": True,
                "is_malasakit": False,
            }
        ]

        result = search.search(city="Davao City", benefits=["PhilHealth"], limit=5)

        self.assertEqual(result.facilities, [])
        self.assertEqual(result.match_tier, "no_city_match")
        self.assertEqual(result.error, "no_facility_city_match")

    def test_backend_emergency_keywords_include_filpino_chat_terms(self) -> None:
        classifier = KeywordEmergencyClassifier(
            keywords_path=Path("data/emergency_keywords.json")
        )

        self.assertIn("masakit dibdib", classifier.matched_keywords("Masakit dibdib ko"))
        self.assertIn("hirap huminga", classifier.matched_keywords("Hirap huminga ngayon"))


if __name__ == "__main__":
    unittest.main()
