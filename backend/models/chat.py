from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

ResponseType = Literal["EMERGENCY", "FOLLOW_UP", "RECOMMENDATION", "RAG_ANSWER"]


class ChatRequest(BaseModel):
    session_id: UUID
    message: str = Field(min_length=1)
    language: str | None = None
    location_city: str | None = None
    benefits: list[str] | None = None
    intent: Literal["HOSPITAL", "RAG"] | None = None


class ChatResponse(BaseModel):
    session_id: UUID
    response_type: ResponseType
    message: str
    data: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)


class ServiceResult(BaseModel):
    response_type: Literal["RECOMMENDATION", "RAG_ANSWER"]
    message: str
    data: dict[str, Any] = Field(default_factory=dict)
