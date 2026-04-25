from dataclasses import dataclass
from os import getenv
from typing import Final

DEFAULT_ALLOWED_ORIGINS: Final[tuple[str, ...]] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str
    app_version: str
    allowed_origins: tuple[str, ...]


def _parse_allowed_origins(raw_origins: str) -> tuple[str, ...]:
    parsed = tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())
    return parsed if parsed else DEFAULT_ALLOWED_ORIGINS


def get_settings() -> Settings:
    raw_origins = getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ALLOWED_ORIGINS))

    return Settings(
        app_name="Nura API",
        app_version="0.1.0",
        allowed_origins=_parse_allowed_origins(raw_origins),
    )
