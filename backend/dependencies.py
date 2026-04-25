from functools import lru_cache
from pathlib import Path

from config import get_settings
from db.session_repository import SessionRepository
from db.supabase_client import get_supabase_client
from services.ai_rag_service import MockAIRagService
from services.emergency_classifier import KeywordEmergencyClassifier
from services.hospital_service import MockHospitalService
from services.orchestrator import ChatOrchestrator


@lru_cache
def get_session_repository() -> SessionRepository:
    return SessionRepository(client=get_supabase_client())


@lru_cache
def get_emergency_classifier() -> KeywordEmergencyClassifier:
    keywords_path = Path(__file__).resolve().parents[1] / "data" / "emergency_keywords.json"
    return KeywordEmergencyClassifier(keywords_path=keywords_path)


@lru_cache
def get_hospital_service() -> MockHospitalService:
    return MockHospitalService()


@lru_cache
def get_ai_rag_service() -> MockAIRagService:
    return MockAIRagService()


@lru_cache
def get_chat_orchestrator() -> ChatOrchestrator:
    settings = get_settings()
    return ChatOrchestrator(
        session_repository=get_session_repository(),
        emergency_classifier=get_emergency_classifier(),
        hospital_service=get_hospital_service(),
        ai_rag_service=get_ai_rag_service(),
        session_ttl_minutes=settings.session_ttl_minutes,
    )
