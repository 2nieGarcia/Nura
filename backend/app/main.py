from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .schemas.chat import ChatRequest, ChatResponse
from .services.chat_service import build_emergency_reply, build_mock_chat_response
from .services.emergency import is_emergency_message
from .services.language import select_response_language

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Nura backend skeleton for healthcare access navigation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse, tags=["chat"])
def post_chat(payload: ChatRequest) -> ChatResponse:
    response_language = select_response_language(payload.message)

    if is_emergency_message(payload.message):
        return ChatResponse(
            session_id=payload.session_id,
            state="emergency",
            reply=build_emergency_reply(response_language),
            facilities=[],
            is_emergency=True,
        )

    return build_mock_chat_response(payload, response_language)
