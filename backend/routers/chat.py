from fastapi import APIRouter, Depends, HTTPException

from db.session_repository import SessionNotFoundError
from dependencies import get_chat_orchestrator
from models.chat import ChatRequest, ChatResponse
from services.orchestrator import ChatOrchestrator, SessionExpiredError

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> ChatResponse:
    try:
        return orchestrator.handle_chat(payload)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SessionExpiredError as exc:
        raise HTTPException(status_code=410, detail=str(exc)) from exc
