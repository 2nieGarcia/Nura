from functools import lru_cache
from typing import TYPE_CHECKING, Any

from config import get_settings

if TYPE_CHECKING:
    from supabase import Client
else:
    Client = Any


@lru_cache
def get_supabase_client() -> Client:
    try:
        from supabase import create_client
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "The Supabase package is required when SESSION_BACKEND=supabase. "
            "Install backend/requirements.txt or set SESSION_BACKEND=memory for local development."
        ) from exc

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
