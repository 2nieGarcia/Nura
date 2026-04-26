from functools import lru_cache
from pathlib import Path

from config import get_settings
from db.session_repository import InMemorySessionRepository, SessionRepository
from db.supabase_client import get_supabase_client
from services.ai_rag_service import (
    GeminiResponseComposer,
    PgVectorBenefitGuideRetriever,
    RagAIRagService,
    ResponseTranslator,
)
from services.emergency_classifier import KeywordEmergencyClassifier
from services.hospital_service import HospitalRecommendationService, SupabaseHealthFacilitySearch
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
def get_response_translator() -> ResponseTranslator:
    settings = get_settings()
    return ResponseTranslator(enabled=settings.translation_enabled)


@lru_cache
def get_benefit_guide_retriever() -> PgVectorBenefitGuideRetriever:
    settings = get_settings()
    return PgVectorBenefitGuideRetriever(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        project_id=settings.resolved_vertex_project_id,
        location=settings.resolved_vertex_location,
        embedding_model=settings.rag_embedding_model,
        rpc_name=settings.rag_match_rpc,
        match_threshold=settings.rag_match_threshold,
    )


@lru_cache
def get_gemini_response_composer() -> GeminiResponseComposer:
    settings = get_settings()
    return GeminiResponseComposer(
        api_key=settings.google_api_key,
        model_name=settings.gemini_model,
        timeout_seconds=settings.gemini_timeout_seconds,
        translator=get_response_translator(),
    )


@lru_cache
def get_hospital_service() -> HospitalRecommendationService:
    settings = get_settings()
    return HospitalRecommendationService(
        facility_search=SupabaseHealthFacilitySearch(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
            table_name=settings.facility_table_name,
            default_region=settings.facility_default_region,
            max_candidates=settings.facility_max_candidates,
            fuzzy_threshold=settings.facility_fuzzy_threshold,
        ),
        response_composer=get_gemini_response_composer(),
        guide_retriever=get_benefit_guide_retriever(),
        result_limit=settings.facility_result_limit,
        rag_chunk_limit=settings.rag_match_count,
    )


@lru_cache
def get_ai_rag_service() -> RagAIRagService:
    settings = get_settings()
    return RagAIRagService(
        retriever=get_benefit_guide_retriever(),
        composer=get_gemini_response_composer(),
        max_chunks=settings.rag_match_count,
    )


@lru_cache
def get_orchestrator_inference_service() -> OrchestratorInferenceService:
    settings = get_settings()
    return VertexGeminiInferenceService(
        project_id=settings.resolved_vertex_project_id,
        location=settings.resolved_vertex_location,
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
