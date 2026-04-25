from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any
from uuid import UUID

from models.session import SessionState

if TYPE_CHECKING:
    from supabase import Client
else:
    Client = Any


class SessionNotFoundError(Exception):
    pass


class SessionRepository:
    def __init__(self, client: Client, table_name: str = "sessions") -> None:
        self.client = client
        self.table_name = table_name

    def create_session(self, language: str | None, ttl_minutes: int) -> SessionState:
        now = datetime.now(timezone.utc)
        payload = {
            "language": language,
            "benefits": [],
            "conversation_history": [],
            "expires_at": (now + timedelta(minutes=ttl_minutes)).isoformat(),
        }
        response = self.client.table(self.table_name).insert(payload).execute()
        return self._extract_one(response)

    def get_session(self, session_id: UUID) -> SessionState | None:
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", str(session_id))
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return None
        return self._to_session(rows[0])

    def update_session(
        self,
        session_id: UUID,
        fields: dict[str, Any] | None = None,
        append_messages: list[dict[str, Any]] | None = None,
        ttl_minutes: int | None = None,
    ) -> SessionState:
        current = self.get_session(session_id)
        if current is None:
            raise SessionNotFoundError(f"Session {session_id} does not exist.")

        payload = dict(fields or {})
        now = datetime.now(timezone.utc)

        if append_messages:
            payload["conversation_history"] = [*current.conversation_history, *append_messages]

        payload["updated_at"] = now.isoformat()
        if ttl_minutes is not None:
            payload["expires_at"] = (now + timedelta(minutes=ttl_minutes)).isoformat()

        response = (
            self.client.table(self.table_name)
            .update(payload)
            .eq("id", str(session_id))
            .execute()
        )
        return self._extract_one(response)

    def _extract_one(self, response: Any) -> SessionState:
        rows = response.data or []
        if not rows:
            raise SessionNotFoundError("No session row was returned from Supabase.")
        return self._to_session(rows[0])

    def _to_session(self, row: dict[str, Any]) -> SessionState:
        normalized = dict(row)
        normalized["benefits"] = normalized.get("benefits") or []
        normalized["conversation_history"] = normalized.get("conversation_history") or []
        return SessionState.model_validate(normalized)
