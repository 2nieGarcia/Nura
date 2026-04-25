from functools import lru_cache
from pathlib import Path

from config import get_settings
from db.session_repository import InMemorySessionRepository, SessionRepository
from db.supabase_client import get_supabase_client
from services.ai_rag_service import MockAIRagService
from services.emergency_classifier import KeywordEmergencyClassifier
from services.hospital_service import MockHospitalService
from services.interfaces import OrchestratorInferenceService
from services.orchestrator import ChatOrchestrator
from services.orchestrator_inference import VertexGeminiInferenceService


def _is_placeholder_supabase_config(url: str, key: str) -> bool:
    return (
        not url.strip()
        or not key.strip()
        or "your-project-id" in url
        or key == "your-service-role-key"
    )


@lru_cache
def get_session_repository() -> SessionRepository | InMemorySessionRepository:
    settings = get_settings()
    use_memory = settings.session_backend == "memory" or (
        settings.session_backend == "auto"
        and _is_placeholder_supabase_config(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    )
    if use_memory:
        return InMemorySessionRepository()
    if _is_placeholder_supabase_config(
        settings.supabase_url,
        settings.supabase_service_role_key,
    ):
        raise RuntimeError(
            "Supabase session backend selected, but SUPABASE_URL or "
            "SUPABASE_SERVICE_ROLE_KEY is not configured."
        )
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
def get_orchestrator_inference_service() -> OrchestratorInferenceService:
    settings = get_settings()
    return VertexGeminiInferenceService(
        project_id=settings.vertex_project_id,
        location=settings.vertex_location,
        model=settings.vertex_model,
        timeout_seconds=settings.vertex_timeout_seconds,
    )


@lru_cache
def get_chat_orchestrator() -> ChatOrchestrator:
    settings = get_settings()
    return ChatOrchestrator(
        session_repository=get_session_repository(),
        emergency_classifier=get_emergency_classifier(),
        hospital_service=get_hospital_service(),
        ai_rag_service=get_ai_rag_service(),
        session_ttl_minutes=settings.session_ttl_minutes,
        inference_service=get_orchestrator_inference_service(),
    )
