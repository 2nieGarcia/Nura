from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from config import get_settings
from db.session_repository import SessionRepository
from dependencies import get_session_repository
from models.session import (
    SessionCreateRequest,
    SessionCreateResponse,
    SessionSummaryResponse,
)

router = APIRouter(prefix="/api/v1", tags=["session"])


@router.post("/session", response_model=SessionCreateResponse, status_code=201)
def create_session(
    payload: SessionCreateRequest | None = None,
    repository: SessionRepository = Depends(get_session_repository),
) -> SessionCreateResponse:
    settings = get_settings()
    payload = payload or SessionCreateRequest()

    session = repository.create_session(
        language=payload.language,
        ttl_minutes=settings.session_ttl_minutes,
    )
    return SessionCreateResponse(session_id=session.id, expires_at=session.expires_at)


@router.get("/session/{session_id}", response_model=SessionSummaryResponse)
def get_session(
    session_id: UUID,
    repository: SessionRepository = Depends(get_session_repository),
) -> SessionSummaryResponse:
    session = repository.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    return SessionSummaryResponse(
        id=session.id,
        language=session.language,
        location_city=session.location_city,
        benefits=session.benefits,
        conversation_history=session.conversation_history,
        expires_at=session.expires_at,
    )
