from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    environment: str = "development"
    allowed_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    session_backend: Literal["auto", "memory", "supabase"] = "auto"
    session_ttl_minutes: int = 60
    vertex_project_id: str | None = None
    gcp_project_id: str | None = None
    gcp_region: str | None = None
    gcp_location: str | None = None
    vertex_location: str = ""
    vertex_model: str = "gemini-1.5-flash"
    vertex_timeout_seconds: int = 12
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: int = 20
    rag_embedding_model: str = "text-embedding-004"
    rag_match_rpc: str = "match_benefits"
    rag_match_threshold: float = 0.1
    rag_match_count: int = 4
    translation_enabled: bool = True
    facility_table_name: str = "health_facilities"
    facility_default_region: str = ""
    facility_result_limit: int = 5
    facility_max_candidates: int = 4000
    facility_fuzzy_threshold: int = 80

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def resolved_vertex_project_id(self) -> str | None:
        return self.vertex_project_id or self.gcp_project_id

    @property
    def resolved_vertex_location(self) -> str:
        return self.vertex_location or self.gcp_region or self.gcp_location or "us-central1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
