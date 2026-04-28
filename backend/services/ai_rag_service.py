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
SECTION_LABELS = ("Explanation", "Where to go", "What to bring", "What to say")


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
            translator = GoogleTranslator(source="en", target=google_code)
            translated = self._translate_structured_sections(text, translator)
            if translated is None:
                translated = translator.translate(text)
        except Exception as exc:
            return TranslationResult(text=text, source="fallback", error=_safe_error(exc))

        return TranslationResult(text=translated or text, source="deep-translator")

    def _translate_structured_sections(self, text: str, translator: Any) -> str | None:
        sections = self._parse_structured_sections(text)
        if sections is None:
            return None

        translated_sections: list[str] = []
        for label, body in sections:
            translated_body = translator.translate(body) if body else ""
            translated_sections.append(f"{label}:\n{translated_body or body}".strip())

        return "\n\n".join(translated_sections)

    def _parse_structured_sections(self, text: str) -> list[tuple[str, str]] | None:
        positions: list[tuple[str, int, int]] = []
        for label in SECTION_LABELS:
            marker = f"{label}:"
            index = text.find(marker)
            if index < 0:
                return None
            positions.append((label, index, index + len(marker)))

        positions.sort(key=lambda item: item[1])
        if [label for label, _, _ in positions] != list(SECTION_LABELS):
            return None

        sections: list[tuple[str, str]] = []
        for index, (label, _, body_start) in enumerate(positions):
            body_end = positions[index + 1][1] if index + 1 < len(positions) else len(text)
            body = text[body_start:body_end].strip()
            sections.append((label, body))

        return sections


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
        if translation.error and _language_code(language) != "en":
            return CompositionResult(
                text=None,
                source="error",
                error=f"translation_error: {translation.error}",
                original_text=bounded_text,
                translation=translation,
            )
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
            "- Do not invent facility names, addresses, benefits, or coverage.\n"
            "- Keep the answer concise and reassuring."
        )

    def _output_contract(self, language: str | None) -> str:
        language_code = _language_code(language)
        target_language = SUPPORTED_LANGUAGES[language_code]["name"]
        if language_code == "en":
            language_instruction = "Write in simple English."
        elif self.translator.enabled:
            language_instruction = (
                f"Write simple English source text. The app will translate the section bodies "
                f"to {target_language} while preserving the section labels."
            )
        else:
            language_instruction = f"Write directly in {target_language}."

        return (
            f"{language_instruction}\n"
            "Return exactly these four section labels, in this order, each on its own line:\n"
            "Explanation:\n"
            "Where to go:\n"
            "What to bring:\n"
            "What to say:\n"
            "Write 1-2 short sentences under each label. Do not use markdown bullets, tables, "
            "JSON, or extra headings."
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
            f"{self._output_contract(session.language)}\n"
            "Answer as Nura. The Explanation section must make clear that Nura is not a doctor."
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
            f"{self._output_contract(session.language)}\n"
            "Answer as Nura. Use only the candidate facilities above. If no candidate facility "
            "is listed, say that no verified matching facility was found and tell the user to "
            "confirm with the LGU health office or PhilHealth desk. Do not name a facility "
            "that is not in the candidate list."
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
            benefit = facility.get("benefit_to_claim") or "Benefit use to confirm"
            bring = facility.get("what_to_bring") or "Requirements to confirm"
            say = facility.get("what_to_say") or "Ask the front desk for assessment"
            source = facility.get("data_source") or "unknown source"
            reliability = facility.get("data_reliability") or "UNKNOWN"
            lines.append(
                f"- {name} ({address}) - {accreditation}. Benefit: {benefit}. "
                f"Bring: {bring}. Say: {say}. Source: {source}, reliability: {reliability}."
            )
        return "\n".join(lines)

    def _ensure_disclaimer(self, text: str) -> str:
        normalized = text.lower()
        if "not a doctor" in normalized or "hindi ako doktor" in normalized:
            return text
        explanation_marker = "Explanation:"
        if explanation_marker in text:
            return text.replace(
                explanation_marker,
                f"{explanation_marker}\nNura is not a doctor and cannot diagnose or prescribe.",
                1,
            )
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
        language_code = _language_code(session.language)
        if language_code == "en":
            if guide_chunks:
                return (
                    "Explanation:\n"
                    "Nura is not a doctor and cannot diagnose or prescribe. Based on the available "
                    f"benefit guide context for {benefits_label}, coverage still needs desk verification.\n\n"
                    "Where to go:\n"
                    "Ask the PhilHealth or facility benefits desk before receiving care.\n\n"
                    "What to bring:\n"
                    "Bring a valid ID, PhilHealth ID or MDR if available, and any benefit proof.\n\n"
                    "What to say:\n"
                    "Please check if I am eligible to use this benefit for my care today."
                )
            return (
                "Explanation:\n"
                "Nura is not a doctor and cannot diagnose or prescribe. I could not reach the "
                f"benefit guide database right now for {benefits_label}.\n\n"
                "Where to go:\n"
                "Confirm coverage with PhilHealth or the facility benefits desk.\n\n"
                "What to bring:\n"
                "Bring a valid ID, PhilHealth ID or MDR if available, and any benefit card or proof.\n\n"
                "What to say:\n"
                "Please confirm my coverage and current requirements before I receive care."
            )

        if language_code == "ceb":
            context = "base sa available benefit guide context" if guide_chunks else "dili nako maabot karon ang benefit guide database"
            return (
                "Explanation:\n"
                f"Dili ako doktor ug dili ako mo-diagnose o moreseta. Para sa {benefits_label}, {context}.\n\n"
                "Where to go:\n"
                "Ipa-confirm sa PhilHealth desk o benefits desk sa pasilidad.\n\n"
                "What to bring:\n"
                "Pagdala ug valid ID, PhilHealth ID o MDR kung naa, ug proof sa benefit.\n\n"
                "What to say:\n"
                "Pa-check ko kung eligible ko mogamit ani nga benefit para sa serbisyo karon."
            )

        if language_code == "ilo":
            context = "base iti available benefit guide context" if guide_chunks else "saan ko a maabot ita ti benefit guide database"
            return (
                "Explanation:\n"
                f"Saanak a doktor ken saanak nga ag-diagnose wenno ag-reseta. Para iti {benefits_label}, {context}.\n\n"
                "Where to go:\n"
                "Ipa-confirm iti PhilHealth desk wenno benefits desk iti pasilidad.\n\n"
                "What to bring:\n"
                "Mangitugot iti valid ID, PhilHealth ID wenno MDR no adda, ken proof ti benefit.\n\n"
                "What to say:\n"
                "Pa-check koma no eligibleak nga agusar daytoy a benefit para iti serbisyo ita."
            )

        if language_code == "hil":
            context = "base sa available benefit guide context" if guide_chunks else "indi ko maabot subong ang benefit guide database"
            return (
                "Explanation:\n"
                f"Indi ako doktor kag indi ako naga-diagnose ukon naga-reseta. Para sa {benefits_label}, {context}.\n\n"
                "Where to go:\n"
                "Ipa-confirm sa PhilHealth desk ukon benefits desk sang pasilidad.\n\n"
                "What to bring:\n"
                "Magdala sang valid ID, PhilHealth ID ukon MDR kung ara, kag proof sang benefit.\n\n"
                "What to say:\n"
                "Pa-check ko kung eligible ako magamit ini nga benefit para sa serbisyo subong."
            )

        if guide_chunks:
            return (
                "Explanation:\n"
                "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. Base sa available "
                f"benefit guide context para sa {benefits_label}, kailangan pa ring ipa-confirm ang eligibility.\n\n"
                "Where to go:\n"
                "Lumapit sa PhilHealth desk o benefits desk ng pasilidad.\n\n"
                "What to bring:\n"
                "Magdala ng valid ID, PhilHealth ID o MDR kung meron, at anumang proof ng benefit.\n\n"
                "What to say:\n"
                "Pa-check po kung eligible akong gamitin ang benefit na ito para sa serbisyo ngayon."
            )
        return (
            "Explanation:\n"
            "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. Hindi ko maabot ngayon "
            f"ang benefit guide database para sa {benefits_label}.\n\n"
            "Where to go:\n"
            "Ipa-confirm muna sa PhilHealth o facility benefits desk.\n\n"
            "What to bring:\n"
            "Magdala ng valid ID, PhilHealth ID o MDR kung meron, at benefit card o proof kung meron.\n\n"
            "What to say:\n"
            "Pa-confirm po ng coverage at current requirements bago ako magpa-serbisyo."
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
