from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Any
from urllib.parse import quote_plus

from models.chat import ServiceResult
from models.session import SessionState
from services.ai_rag_service import (
    GeminiResponseComposer,
    PgVectorBenefitGuideRetriever,
    RetrievalResult,
)
from services.interfaces import HospitalService


REGION_ALIASES: dict[str, str] = {
    "ncr": "National Capital",
    "national capital region": "National Capital",
    "ncr - national capital region": "National Capital",
    "metro manila": "National Capital",
    "region i": "Ilocos",
    "region 1": "Ilocos",
    "ilocos": "Ilocos",
    "region ii": "Cagayan Valley",
    "region 2": "Cagayan Valley",
    "region iii": "Central Luzon",
    "region 3": "Central Luzon",
    "region iv-a": "CALABARZON",
    "region 4a": "CALABARZON",
    "region iv-b": "MIMAROPA",
    "region 4b": "MIMAROPA",
    "region v": "Bicol",
    "region 5": "Bicol",
    "region vi": "Western Visayas",
    "region 6": "Western Visayas",
    "region vii": "Central Visayas",
    "region 7": "Central Visayas",
    "region viii": "Eastern Visayas",
    "region 8": "Eastern Visayas",
    "region ix": "Zamboanga",
    "region 9": "Zamboanga",
    "region x": "Northern Mindanao",
    "region 10": "Northern Mindanao",
    "region xi": "Davao",
    "region 11": "Davao",
    "region xii": "SOCCSKSARGEN",
    "region 12": "SOCCSKSARGEN",
    "region xiii": "Caraga",
    "region 13": "Caraga",
    "barmm": "Bangsamoro",
    "bangsamoro": "Bangsamoro",
}


FACILITY_COLUMNS = (
    "id, name_of_health_facility, street, municipality_city, region, "
    "is_philhealth, is_malasakit, expire_date, source"
)


@dataclass(frozen=True, slots=True)
class FacilitySearchResult:
    facilities: list[dict[str, Any]] = field(default_factory=list)
    source: str = "disabled"
    match_tier: str = "fallback"
    total_results: int = 0
    error: str | None = None


def _is_placeholder(value: str | None) -> bool:
    cleaned = (value or "").strip()
    return (
        not cleaned
        or "your-project-id" in cleaned
        or cleaned in {"your-service-role-key", "your-supabase-key"}
    )


def _safe_error(exc: Exception) -> str:
    return f"{exc.__class__.__name__}: {str(exc)[:220]}"


def _normalize(text: str | None) -> str:
    return " ".join((text or "").strip().lower().split())


def _language_code(language: str | None) -> str:
    normalized = (language or "fil").strip().lower()
    if normalized == "auto":
        return "fil"
    if normalized in {"en", "fil", "ceb", "ilo", "hil"}:
        return normalized
    return "fil"


def _resolve_region(region: str) -> str:
    return REGION_ALIASES.get(_normalize(region), region.strip())


def _fuzzy_score(left: str | None, right: str | None) -> int:
    return round(SequenceMatcher(None, _normalize(left), _normalize(right)).ratio() * 100)


class SupabaseHealthFacilitySearch:
    def __init__(
        self,
        *,
        supabase_url: str,
        supabase_key: str,
        table_name: str,
        default_region: str,
        max_candidates: int,
        fuzzy_threshold: int,
    ) -> None:
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.table_name = table_name
        self.default_region = default_region.strip()
        self.max_candidates = max_candidates
        self.fuzzy_threshold = fuzzy_threshold
        self._supabase: Any | None = None

    def search(self, *, city: str, benefits: list[str], limit: int) -> FacilitySearchResult:
        city = city.strip()
        if not city:
            return FacilitySearchResult(source="disabled", error="empty_city")
        if _is_placeholder(self.supabase_url) or _is_placeholder(self.supabase_key):
            return FacilitySearchResult(source="disabled", error="supabase_not_configured")

        try:
            candidates = self._fetch_candidates(
                benefits=benefits,
                city_prefilter=None if self.default_region else city,
            )
        except ModuleNotFoundError as exc:
            return FacilitySearchResult(source="disabled", error=_safe_error(exc))
        except Exception as exc:
            return FacilitySearchResult(source="error", error=_safe_error(exc))

        if not candidates:
            return FacilitySearchResult(
                source="supabase-health-facility-search",
                match_tier="no_city_candidates",
                error="no_facility_candidates_for_city",
            )

        city_norm = _normalize(city)
        exact = [
            row
            for row in candidates
            if _normalize(row.get("municipality_city")) == city_norm
            or city_norm in _normalize(row.get("municipality_city"))
        ]
        if exact:
            return self._result(rows=exact, tier="exact_city", city=city, limit=limit)

        fuzzy = [
            row
            for row in candidates
            if _fuzzy_score(row.get("municipality_city"), city) >= self.fuzzy_threshold
        ]
        if fuzzy:
            return self._result(rows=fuzzy, tier="fuzzy_city", city=city, limit=limit)

        return FacilitySearchResult(
            source="supabase-health-facility-search",
            match_tier="no_city_match",
            total_results=len(candidates),
            error="no_facility_city_match",
        )

    def _fetch_candidates(
        self,
        *,
        benefits: list[str],
        city_prefilter: str | None,
    ) -> list[dict[str, Any]]:
        query = (
            self._get_supabase_client()
            .table(self.table_name)
            .select(FACILITY_COLUMNS)
            .limit(self.max_candidates)
        )

        if self.default_region:
            query = query.ilike("region", f"%{_resolve_region(self.default_region)}%")
        if city_prefilter:
            query = query.ilike("municipality_city", f"%{city_prefilter.strip()}%")

        wants_philhealth, wants_malasakit = self._benefit_filters(benefits)
        if wants_philhealth:
            query = query.eq("is_philhealth", True)
        if wants_malasakit:
            query = query.eq("is_malasakit", True)

        return query.execute().data or []

    def _benefit_filters(self, benefits: list[str]) -> tuple[bool, bool]:
        normalized = {_normalize(benefit) for benefit in benefits}
        no_declared = "no declared benefits" in normalized
        wants_malasakit = any("malasakit" in benefit for benefit in normalized)
        wants_philhealth = any(
            token in benefit
            for benefit in normalized
            for token in ("philhealth", "yakap", "senior", "pwd", "4ps")
        )
        if no_declared and not wants_malasakit:
            wants_philhealth = False
        return wants_philhealth, wants_malasakit

    def _result(
        self,
        *,
        rows: list[dict[str, Any]],
        tier: str,
        city: str,
        limit: int,
    ) -> FacilitySearchResult:
        facilities = [
            self._normalize_facility(row=row, tier=tier, index=index, query_city=city)
            for index, row in enumerate(rows[:limit], start=1)
        ]
        return FacilitySearchResult(
            facilities=facilities,
            source="supabase-health-facility-search",
            match_tier=tier,
            total_results=len(rows),
        )

    def _normalize_facility(
        self,
        *,
        row: dict[str, Any],
        tier: str,
        index: int,
        query_city: str,
    ) -> dict[str, Any]:
        facility_city = row.get("municipality_city") or query_city
        name = row.get("name_of_health_facility") or row.get("name") or "Health Facility"
        street = row.get("street") or ""
        address_parts = [str(street).strip(), str(facility_city).strip()]
        address = ", ".join(part for part in address_parts if part) or "Address to confirm"
        is_philhealth = bool(row.get("is_philhealth"))
        is_malasakit = bool(row.get("is_malasakit"))

        accreditation: list[str] = []
        if is_philhealth:
            accreditation.append("PhilHealth accredited")
        if is_malasakit:
            accreditation.append("Malasakit Center")

        data_source = "MALASAKIT" if is_malasakit else "YAKAP" if is_philhealth else "LGU"
        maps_query = quote_plus(f"{name} {address}")

        return {
            "id": str(row.get("id") or f"facility-{tier}-{index}"),
            "name": name,
            "address": address,
            "city": facility_city,
            "region": row.get("region"),
            "accreditation": ", ".join(accreditation) or "Accreditation to confirm",
            "benefit_to_claim": self._benefit_to_claim(is_philhealth, is_malasakit),
            "what_to_say": (
                "Magpapa-assess po ako. Pwede po bang i-check kung magagamit ko ang "
                "benefit ko dito?"
            ),
            "what_to_bring": (
                "Valid ID, PhilHealth ID or MDR if available, benefit card or proof, "
                "and any previous records."
            ),
            "hours": "Call facility to confirm current OPD hours.",
            "maps_url": f"https://maps.google.com/?q={maps_query}",
            "data_source": data_source,
            "data_reliability": self._reliability_for_tier(tier),
            "is_emergency_capable": None,
            "raw": {
                "name_of_health_facility": row.get("name_of_health_facility"),
                "street": row.get("street"),
                "municipality_city": row.get("municipality_city"),
                "region": row.get("region"),
                "is_philhealth": is_philhealth,
                "is_malasakit": is_malasakit,
                "expire_date": row.get("expire_date"),
                "source": row.get("source"),
                "match_tier": tier,
            },
        }

    def _benefit_to_claim(self, is_philhealth: bool, is_malasakit: bool) -> str:
        if is_philhealth and is_malasakit:
            return "Ask the PhilHealth or Malasakit desk to verify the benefit you can use."
        if is_philhealth:
            return "Ask the PhilHealth desk to verify coverage and requirements."
        if is_malasakit:
            return "Ask the Malasakit desk about available assistance."
        return "Ask the facility desk what public assistance or LGU support is available."

    def _reliability_for_tier(self, tier: str) -> str:
        if tier == "exact_city":
            return "HIGH"
        if tier == "fuzzy_city":
            return "MEDIUM"
        return "LOW"

    def _get_supabase_client(self) -> Any:
        if self._supabase is not None:
            return self._supabase

        from supabase import create_client

        self._supabase = create_client(self.supabase_url, self.supabase_key)
        return self._supabase


class HospitalRecommendationService(HospitalService):
    def __init__(
        self,
        *,
        facility_search: SupabaseHealthFacilitySearch | None,
        response_composer: GeminiResponseComposer,
        guide_retriever: PgVectorBenefitGuideRetriever | None,
        result_limit: int,
        rag_chunk_limit: int,
    ) -> None:
        self.facility_search = facility_search
        self.response_composer = response_composer
        self.guide_retriever = guide_retriever
        self.result_limit = result_limit
        self.rag_chunk_limit = rag_chunk_limit

    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        city = session.location_city or "your city"
        search_result = self._search_facilities(city=city, benefits=session.benefits)
        facilities = search_result.facilities

        retrieval = self._retrieve_guides(message)
        composition = (
            self.response_composer.compose_facility_recommendation(
                session=session,
                message=message,
                facilities=facilities,
                guide_chunks=retrieval.chunks,
            )
            if facilities
            else None
        )
        if composition and composition.text:
            reply = composition.text
            source = "facility-search-gemini-service"
        else:
            reply = self._fallback_reply(session=session, facilities=facilities)
            source = "facility-search-fallback-service"

        return ServiceResult(
            response_type="RECOMMENDATION",
            message=reply,
            data={
                "facilities": facilities,
                "hospitals": facilities,
                "source": source,
                "facility_search": {
                    "source": search_result.source,
                    "match_tier": search_result.match_tier,
                    "total_results": search_result.total_results,
                    "error": search_result.error,
                },
                "retrieval": {
                    "source": retrieval.source,
                    "error": retrieval.error,
                    "chunks_returned": len(retrieval.chunks),
                },
                "llm": {
                    "source": composition.source if composition else "skipped",
                    "error": composition.error if composition else "no_verified_facilities",
                },
            },
        )

    def _search_facilities(self, *, city: str, benefits: list[str]) -> FacilitySearchResult:
        if self.facility_search is None:
            return FacilitySearchResult(source="disabled", error="facility_search_not_configured")
        return self.facility_search.search(city=city, benefits=benefits, limit=self.result_limit)

    def _retrieve_guides(self, message: str) -> RetrievalResult:
        if self.guide_retriever is None:
            return RetrievalResult(source="disabled", error="retriever_not_configured")
        return self.guide_retriever.retrieve(query_text=message, limit=self.rag_chunk_limit)

    def _fallback_reply(
        self,
        *,
        session: SessionState,
        facilities: list[dict[str, Any]],
    ) -> str:
        city = session.location_city or "your city"
        benefits_label = ", ".join(session.benefits) if session.benefits else "your benefits"
        primary = facilities[0] if facilities else None
        language_code = _language_code(session.language)

        if language_code == "en":
            if primary:
                return self._structured_reply(
                    explanation=(
                        "Nura is not a doctor and cannot diagnose or prescribe. This is a "
                        "facility and benefit guide based on available records."
                    ),
                    where=(
                        f"Go to {primary['name']} in {primary.get('address', city)}. "
                        "Call or check the desk first because facility details can change."
                    ),
                    bring=primary.get("what_to_bring")
                    or "Bring a valid ID, benefit card or proof, and any previous records.",
                    say=primary.get("what_to_say")
                    or "Please assess me and check what benefit I can use here.",
                )
            return self._structured_reply(
                explanation=(
                    "Nura is not a doctor and cannot diagnose or prescribe. I could not find a "
                    f"verified matching facility in the current facility data for {city}."
                ),
                where="Contact your LGU health office, PhilHealth desk, or nearest public hospital to confirm where to go.",
                bring="Bring a valid ID, benefit card or proof if available, and any previous records.",
                say="Please help me find the right clinic or desk for my concern and benefits.",
            )

        if language_code == "ceb":
            if primary:
                return self._structured_reply(
                    explanation=(
                        "Dili ako doktor ug dili ako mo-diagnose o moreseta. Giya kini sa "
                        "pasilidad ug benepisyo base sa available records."
                    ),
                    where=(
                        f"Adto sa {primary['name']} sa {primary.get('address', city)}. "
                        "Manawag o mag-confirm una sa desk kay mahimong mausab ang detalye."
                    ),
                    bring=primary.get("what_to_bring")
                    or "Pagdala ug valid ID, benefit card o proof kung naa, ug previous records.",
                    say=primary.get("what_to_say")
                    or "Magpa-assess ko ug pa-check kung unsang benefit ang magamit nako diri.",
                )
            return self._structured_reply(
                explanation=(
                    "Dili ako doktor ug dili ako mo-diagnose o moreseta. Wala koy nakitang "
                    f"verified matching facility sa current data para sa {city}."
                ),
                where="Kontaka ang LGU health office, PhilHealth desk, o pinakaduol nga public hospital para ma-confirm asa moadto.",
                bring="Pagdala ug valid ID, benefit card o proof kung naa, ug previous records.",
                say="Tabangi ko pangita sa sakto nga clinic o desk para sa akong concern ug benefit.",
            )

        if language_code == "ilo":
            if primary:
                return self._structured_reply(
                    explanation=(
                        "Saanak a doktor ken saanak nga ag-diagnose wenno ag-reseta. Daytoy ket "
                        "gabay laeng iti pasilidad ken benepisyo manipud iti available records."
                    ),
                    where=(
                        f"Mapan iti {primary['name']} iti {primary.get('address', city)}. "
                        "Tumawag wenno i-confirm pay iti desk ta mabalin agbaliw dagiti detalye."
                    ),
                    bring=primary.get("what_to_bring")
                    or "Mangitugot iti valid ID, benefit card wenno proof no adda, ken previous records.",
                    say=primary.get("what_to_say")
                    or "Agpa-assessak koma ken pa-check no ania a benefit ti mabalin nga usaren ditoy.",
                )
            return self._structured_reply(
                explanation=(
                    "Saanak a doktor ken saanak nga ag-diagnose wenno ag-reseta. Awan ti "
                    f"nasarak a verified matching facility iti current data para iti {city}."
                ),
                where="Kontaken ti LGU health office, PhilHealth desk, wenno asideg a public hospital tapno ma-confirm no sadino ti papanan.",
                bring="Mangitugot iti valid ID, benefit card wenno proof no adda, ken previous records.",
                say="Tulongandak koma nga agsapul iti umiso a clinic wenno desk para iti concern ken benefit ko.",
            )

        if language_code == "hil":
            if primary:
                return self._structured_reply(
                    explanation=(
                        "Indi ako doktor kag indi ako naga-diagnose ukon naga-reseta. Giya ini sa "
                        "pasilidad kag benepisyo base sa available records."
                    ),
                    where=(
                        f"Kadto sa {primary['name']} sa {primary.get('address', city)}. "
                        "Tawag ukon i-confirm anay sa desk kay posible magbag-o ang detalye."
                    ),
                    bring=primary.get("what_to_bring")
                    or "Magdala sang valid ID, benefit card ukon proof kung ara, kag previous records.",
                    say=primary.get("what_to_say")
                    or "Magpa-assess ko kag pa-check kung ano nga benefit ang magamit ko diri.",
                )
            return self._structured_reply(
                explanation=(
                    "Indi ako doktor kag indi ako naga-diagnose ukon naga-reseta. Wala ako sang "
                    f"nakit-an nga verified matching facility sa current data para sa {city}."
                ),
                where="Kontaka ang LGU health office, PhilHealth desk, ukon pinakamalapit nga public hospital para ma-confirm diin magkadto.",
                bring="Magdala sang valid ID, benefit card ukon proof kung ara, kag previous records.",
                say="Buligi ko pangita sang insakto nga clinic ukon desk para sa akon concern kag benefit.",
            )

        if primary:
            return self._structured_reply(
                explanation=(
                    "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. Gabay ito sa "
                    "pasilidad at benefit batay sa available records."
                ),
                where=(
                    f"Pumunta sa {primary['name']} sa {primary.get('address', city)}. "
                    "Tumawag o mag-confirm muna sa desk dahil maaaring magbago ang details."
                ),
                bring=primary.get("what_to_bring")
                or "Magdala ng valid ID, benefit card o proof kung meron, at previous records.",
                say=primary.get("what_to_say")
                or "Magpapa-assess po ako at pa-check kung anong benefit ang magagamit ko rito.",
            )
        return self._structured_reply(
            explanation=(
                "Hindi ako doktor at hindi ako nagdi-diagnose o nagrereseta. Wala akong nahanap "
                f"na verified matching facility sa current facility data para sa {city}."
            ),
            where="Kontakin ang LGU health office, PhilHealth desk, o pinakamalapit na public hospital para ma-confirm kung saan pupunta.",
            bring="Magdala ng valid ID, benefit card o proof kung meron, at previous records.",
            say="Patulong po hanapin ang tamang clinic o desk para sa concern at benefit ko.",
        )

    def _structured_reply(
        self,
        *,
        explanation: str,
        where: str,
        bring: str,
        say: str,
    ) -> str:
        return (
            f"Explanation:\n{explanation}\n\n"
            f"Where to go:\n{where}\n\n"
            f"What to bring:\n{bring}\n\n"
            f"What to say:\n{say}"
        )

class MockHospitalService(HospitalRecommendationService):
    """Backward-compatible local fallback for older imports."""

    def __init__(self) -> None:
        from services.ai_rag_service import GeminiResponseComposer, ResponseTranslator

        super().__init__(
            facility_search=None,
            response_composer=GeminiResponseComposer(
                api_key="",
                model_name="gemini-2.5-flash",
                timeout_seconds=20,
                translator=ResponseTranslator(enabled=False),
            ),
            guide_retriever=None,
            result_limit=5,
            rag_chunk_limit=0,
        )
