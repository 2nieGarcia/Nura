from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SessionState(BaseModel):
    id: UUID
    language: str | None = None
    location_city: str | None = None
    location_raw: str | None = None
    benefits: list[str] = Field(default_factory=list)
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    expires_at: datetime | None = None

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False

        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return expires_at <= datetime.now(timezone.utc)


class SessionCreateRequest(BaseModel):
    language: str | None = None


class SessionCreateResponse(BaseModel):
    session_id: UUID
    expires_at: datetime


class SessionSummaryResponse(BaseModel):
    id: UUID
    language: str | None = None
    location_city: str | None = None
    benefits: list[str] = Field(default_factory=list)
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    expires_at: datetime | None = None
