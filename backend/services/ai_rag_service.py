from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from models.chat import ServiceResult
from models.session import SessionState
from services.interfaces import AIRagService


SUPPORTED_LANGUAGES: dict[str, dict[str, str | None]] = {
    "en": {"name": "English", "google_code": None},
    "fil": {"name": "Filipino", "google_code": "tl"},
    "ceb": {"name": "Cebuano", "google_code": "ceb"},
    "hil": {"name": "Hiligaynon", "google_code": "ceb"},
    "ilo": {"name": "Ilocano", "google_code": "ilo"},
}


@dataclass(frozen=True, slots=True)
class GuideChunk:
    content: str
    source: str | None = None
    similarity: float | None = None


@dataclass(frozen=True, slots=True)
class RetrievalResult:
    chunks: list[GuideChunk] = field(default_factory=list)
    source: str = "disabled"
    error: str | None = None


@dataclass(frozen=True, slots=True)
class TranslationResult:
    text: str
    source: str = "none"
    error: str | None = None


@dataclass(frozen=True, slots=True)
class CompositionResult:
    text: str | None
    source: str = "disabled"
    error: str | None = None
    original_text: str | None = None
    translation: TranslationResult | None = None


def _is_placeholder(value: str | None) -> bool:
    cleaned = (value or "").strip()
    return (
        not cleaned
        or "your-project-id" in cleaned
        or cleaned in {"your-service-role-key", "your-gcp-project-id", "your-google-api-key"}
    )


def _safe_error(exc: Exception) -> str:
    return f"{exc.__class__.__name__}: {str(exc)[:220]}"


def _language_code(language: str | None) -> str:
    if not language:
        return "fil"
    normalized = language.strip().lower()
    return normalized if normalized in SUPPORTED_LANGUAGES else "fil"


class ResponseTranslator:
    def __init__(self, enabled: bool) -> None:
        self.enabled = enabled

    def translate(self, text: str, language: str | None) -> TranslationResult:
        language_code = _language_code(language)
        config = SUPPORTED_LANGUAGES.get(language_code, SUPPORTED_LANGUAGES["fil"])
        google_code = config.get("google_code")

        if not self.enabled or language_code == "en" or not google_code:
            return TranslationResult(text=text, source="none")

        try:
            from deep_translator import GoogleTranslator
        except ModuleNotFoundError as exc:
            return TranslationResult(text=text, source="fallback", error=_safe_error(exc))

        try:
            translated = GoogleTranslator(source="en", target=google_code).translate(text)
        except Exception as exc:
            return TranslationResult(text=text, source="fallback", error=_safe_error(exc))

        return TranslationResult(text=translated or text, source="deep-translator")


class PgVectorBenefitGuideRetriever:
    def __init__(
        self,
        *,
        supabase_url: str,
        supabase_key: str,
        project_id: str | None,
        location: str,
        embedding_model: str,
        rpc_name: str,
        match_threshold: float,
    ) -> None:
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.project_id = (project_id or "").strip()
        self.location = location
        self.embedding_model_name = embedding_model
        self.rpc_name = rpc_name
        self.match_threshold = match_threshold
        self._supabase: Any | None = None
        self._embedding_model: Any | None = None

    def retrieve(self, query_text: str, limit: int) -> RetrievalResult:
        query_text = query_text.strip()
        if not query_text:
            return RetrievalResult(source="disabled", error="empty_query")
        if _is_placeholder(self.supabase_url) or _is_placeholder(self.supabase_key):
            return RetrievalResult(source="disabled", error="supabase_not_configured")
        if _is_placeholder(self.project_id):
            return RetrievalResult(source="disabled", error="vertex_project_not_configured")

        try:
            query_embedding = self._embed_query(query_text)
        except ModuleNotFoundError as exc:
            return RetrievalResult(source="disabled", error=_safe_error(exc))
        except Exception as exc:
            return RetrievalResult(source="error", error=_safe_error(exc))

        try:
            response = (
                self._get_supabase_client()
                .rpc(
                    self.rpc_name,
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": self.match_threshold,
                        "match_count": limit,
                    },
                )
                .execute()
            )
        except ModuleNotFoundError as exc:
            return RetrievalResult(source="disabled", error=_safe_error(exc))
        except Exception as exc:
            return RetrievalResult(source="error", error=_safe_error(exc))

        chunks: list[GuideChunk] = []
        for row in response.data or []:
            if not isinstance(row, dict):
                continue
            content = row.get("content")
            if not isinstance(content, str) or not content.strip():
                continue
            chunks.append(
                GuideChunk(
                    content=content.strip(),
                    source=row.get("source") if isinstance(row.get("source"), str) else None,
                    similarity=(
                        float(row["similarity"])
                        if isinstance(row.get("similarity"), int | float)
                        else None
                    ),
                )
            )

        return RetrievalResult(chunks=chunks, source="pgvector")

    def _embed_query(self, query_text: str) -> list[float]:
        model = self._get_embedding_model()
        from vertexai.language_models import TextEmbeddingInput

        inputs = [TextEmbeddingInput(query_text, "RETRIEVAL_QUERY")]
        embeddings = model.get_embeddings(inputs)
        return list(embeddings[0].values)

    def _get_embedding_model(self) -> Any:
        if self._embedding_model is not None:
            return self._embedding_model

        import vertexai
        from vertexai.language_models import TextEmbeddingModel

        vertexai.init(project=self.project_id, location=self.location)
        self._embedding_model = TextEmbeddingModel.from_pretrained(self.embedding_model_name)
        return self._embedding_model

    def _get_supabase_client(self) -> Any:
        if self._supabase is not None:
            return self._supabase

        from supabase import create_client

        self._supabase = create_client(self.supabase_url, self.supabase_key)
        return self._supabase


class GeminiResponseComposer:
    def __init__(
        self,
        *,
        api_key: str,
        model_name: str,
        timeout_seconds: int,
        translator: ResponseTranslator,
    ) -> None:
        self.api_key = api_key.strip().strip('"')
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.translator = translator
        self._model: Any | None = None

    def compose_benefit_answer(
        self,
        *,
        session: SessionState,
        message: str,
        guide_chunks: list[GuideChunk],
    ) -> CompositionResult:
        prompt = self._benefit_prompt(session=session, message=message, guide_chunks=guide_chunks)
        return self._compose(prompt=prompt, language=session.language)

    def compose_facility_recommendation(
        self,
        *,
        session: SessionState,
        message: str,
        facilities: list[dict[str, Any]],
        guide_chunks: list[GuideChunk],
    ) -> CompositionResult:
        prompt = self._facility_prompt(
            session=session,
            message=message,
            facilities=facilities,
            guide_chunks=guide_chunks,
        )
        return self._compose(prompt=prompt, language=session.language)

    def _compose(self, *, prompt: str, language: str | None) -> CompositionResult:
        if _is_placeholder(self.api_key):
            return CompositionResult(text=None, source="disabled", error="google_api_key_not_configured")

        try:
            model = self._get_model()
            try:
                response = model.generate_content(
                    prompt,
                    request_options={"timeout": self.timeout_seconds},
                )
            except TypeError:
                response = model.generate_content(prompt)
        except ModuleNotFoundError as exc:
            return CompositionResult(text=None, source="disabled", error=_safe_error(exc))
        except Exception as exc:
            return CompositionResult(text=None, source="error", error=_safe_error(exc))

        raw_text = getattr(response, "text", None)
        if not isinstance(raw_text, str) or not raw_text.strip():
            return CompositionResult(text=None, source="error", error="empty_gemini_response")

        bounded_text = self._ensure_disclaimer(raw_text.strip())
        translation = self.translator.translate(bounded_text, language)
        return CompositionResult(
            text=translation.text,
            source="gemini",
            original_text=bounded_text if translation.source != "none" else None,
            translation=translation,
        )

    def _get_model(self) -> Any:
        if self._model is not None:
            return self._model

        import google.generativeai as genai

        genai.configure(api_key=self.api_key)
        self._model = genai.GenerativeModel(self.model_name)
        return self._model

    def _system_rules(self) -> str:
        return (
            "You are Nura, a healthcare access guide for people in the Philippines.\n"
            "Critical rules:\n"
            "- Nura is not a doctor.\n"
            "- Do not diagnose, assess clinical severity, prescribe medicine, suggest dosages, "
            "or give home remedies.\n"
            "- Emergency keyword detection already ran before this prompt. Do not perform triage.\n"
            "- Give practical healthcare access guidance: where to go, what benefit may apply, "
            "what to bring, and what to say at the front desk.\n"
            "- Use retrieved benefit context when it is relevant. If the context is insufficient, "
            "say the user should confirm with PhilHealth or the facility desk.\n"
            "- Keep the answer concise and reassuring."
        )

    def _benefit_prompt(
        self,
        *,
        session: SessionState,
        message: str,
        guide_chunks: list[GuideChunk],
    ) -> str:
        return (
            f"{self._system_rules()}\n\n"
            f"User city: {session.location_city or 'unknown'}\n"
            f"User benefits: {', '.join(session.benefits) or 'none declared'}\n\n"
            "--- Retrieved Benefit Guide Context ---\n"
            f"{self._format_chunks(guide_chunks)}\n\n"
            f"User question: {message}\n\n"
            "Answer as Nura. Start by making clear that Nura is not a doctor."
        )

    def _facility_prompt(
        self,
        *,
        session: SessionState,
        message: str,
        facilities: list[dict[str, Any]],
        guide_chunks: list[GuideChunk],
    ) -> str:
        return (
            f"{self._system_rules()}\n\n"
            f"User city: {session.location_city or 'unknown'}\n"
            f"User benefits: {', '.join(session.benefits) or 'none declared'}\n\n"
            "--- Retrieved Benefit Guide Context ---\n"
            f"{self._format_chunks(guide_chunks)}\n\n"
            "--- Candidate Facilities ---\n"
            f"{self._format_facilities(facilities)}\n\n"
            f"User concern: {message}\n\n"
            "Answer as Nura. Mention the listed facilities naturally and tell the user to "
            "seek a healthcare professional for assessment."
        )

    def _format_chunks(self, guide_chunks: list[GuideChunk]) -> str:
        if not guide_chunks:
            return "No retrieved benefit context is available."

        lines: list[str] = []
        for index, chunk in enumerate(guide_chunks, start=1):
            source = f" Source: {chunk.source}." if chunk.source else ""
            lines.append(f"{index}. {chunk.content[:900]}{source}")
        return "\n\n".join(lines)

    def _format_facilities(self, facilities: list[dict[str, Any]]) -> str:
        if not facilities:
            return "No matching facilities were found."

        lines: list[str] = []
        for facility in facilities[:5]:
            name = facility.get("name") or "Unknown facility"
            address = facility.get("address") or facility.get("city") or "Address to confirm"
            accreditation = facility.get("accreditation") or "Accreditation to confirm"
            lines.append(f"- {name} ({address}) - {accreditation}")
        return "\n".join(lines)

    def _ensure_disclaimer(self, text: str) -> str:
        normalized = text.lower()
        if "not a doctor" in normalized or "hindi ako doktor" in normalized:
            return text
        return f"Nura is not a doctor and cannot diagnose or prescribe.\n\n{text}"


class RagAIRagService(AIRagService):
    def __init__(
        self,
        *,
        retriever: PgVectorBenefitGuideRetriever | None,
        composer: GeminiResponseComposer,
        max_chunks: int,
    ) -> None:
        self.retriever = retriever
        self.composer = composer
        self.max_chunks = max_chunks

    def answer(self, session: SessionState, message: str) -> ServiceResult:
        retrieval = (
            self.retriever.retrieve(query_text=message, limit=self.max_chunks)
            if self.retriever is not None
            else RetrievalResult(source="disabled", error="retriever_not_configured")
        )

        composition = self.composer.compose_benefit_answer(
            session=session,
            message=message,
            guide_chunks=retrieval.chunks,
        )

        if composition.text:
            reply = composition.text
            source = "rag-gemini-service"
        else:
            reply = self._fallback_answer(session=session, guide_chunks=retrieval.chunks)
            source = "rag-fallback-service"

        return ServiceResult(
            response_type="RAG_ANSWER",
            message=reply,
            data={
                "answer": reply,
                "source": source,
                "guide_chunks": self._chunk_payload(retrieval.chunks),
                "retrieval": {
                    "source": retrieval.source,
                    "error": retrieval.error,
                    "chunks_returned": len(retrieval.chunks),
                },
                "llm": {
                    "source": composition.source,
                    "error": composition.error,
                },
                "translation": self._translation_payload(composition.translation),
            },
        )

    def _fallback_answer(
        self,
        *,
        session: SessionState,
        guide_chunks: list[GuideChunk],
    ) -> str:
        benefits_label = ", ".join(session.benefits) if session.benefits else "your benefits"
        if session.language == "en":
            if guide_chunks:
                return (
                    "Nura is not a doctor and cannot diagnose or prescribe. "
                    f"Based on the available benefit guide context for {benefits_label}, "
                    "you may use the listed coverage only after the facility verifies your "
                    "eligibility. Please ask the PhilHealth or facility desk to confirm the "
                    "current requirements before receiving care."
                )
            return (
                "Nura is not a doctor and cannot diagnose or prescribe. "
                f"I could not reach the benefit guide database right now. For {benefits_label}, "
                "please confirm coverage and requirements with PhilHealth or the facility desk."
            )

        if guide_chunks:
            return (
                "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. "
                f"Base sa available benefit guide context para sa {benefits_label}, "
                "ipa-confirm pa rin sa PhilHealth o facility desk ang eligibility at requirements "
                "bago magpa-serbisyo."
            )
        return (
            "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. "
            "Hindi ko maabot ngayon ang benefit guide database, kaya ipa-confirm muna sa "
            f"PhilHealth o facility desk ang coverage at requirements para sa {benefits_label}."
        )

    def _chunk_payload(self, chunks: list[GuideChunk]) -> list[dict[str, Any]]:
        return [
            {
                "content": chunk.content[:700],
                "source": chunk.source,
                "similarity": chunk.similarity,
            }
            for chunk in chunks
        ]

    def _translation_payload(
        self,
        translation: TranslationResult | None,
    ) -> dict[str, str | None]:
        if translation is None:
            return {"source": "none", "error": None}
        return {"source": translation.source, "error": translation.error}


class MockAIRagService(RagAIRagService):
    """Backward-compatible local fallback for older imports."""

    def __init__(self) -> None:
        super().__init__(
            retriever=None,
            composer=GeminiResponseComposer(
                api_key="",
                model_name="gemini-2.5-flash",
                timeout_seconds=20,
                translator=ResponseTranslator(enabled=False),
            ),
            max_chunks=0,
        )
