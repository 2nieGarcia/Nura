import json
from urllib import error, request

import google.auth
from google.auth.transport.requests import Request

from models.session import SessionState
from services.interfaces import InferenceResult, OrchestratorInferenceService


class VertexGeminiInferenceService(OrchestratorInferenceService):
    def __init__(
        self,
        project_id: str | None,
        location: str,
        model: str,
        timeout_seconds: int,
    ) -> None:
        self.project_id = (project_id or "").strip()
        self.location = location
        self.model = model
        self.timeout_seconds = timeout_seconds

    def infer(self, session: SessionState, message: str) -> InferenceResult:
        token, project_id, auth_error = self._get_access_token_and_project()
        if auth_error == "auth_not_configured":
            return InferenceResult(source="disabled")
        if auth_error is not None:
            return InferenceResult(source="error", error=auth_error)

        payload = {
            "systemInstruction": {"parts": [{"text": self._system_prompt()}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": json.dumps(
                                {
                                    "message": message,
                                    "session": {
                                        "language": session.language,
                                        "location_city": session.location_city,
                                        "benefits": session.benefits,
                                    },
                                },
                                ensure_ascii=True,
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }

        raw_response, error_message = self._post_generate_content(
            payload=payload,
            access_token=token,
            project_id=project_id,
        )
        if error_message is not None:
            return InferenceResult(source="error", error=error_message)
        if raw_response is None:
            return InferenceResult(source="error", error="empty_provider_response")

        content = self._extract_content(raw_response)
        if content is None:
            return InferenceResult(source="error", error="missing_model_content")

        parsed_json, parse_error = self._parse_model_json(content)
        if parse_error is not None:
            return InferenceResult(source="error", error=parse_error)

        return InferenceResult(
            intent=self._normalize_intent(parsed_json.get("intent")),
            location_city=self._normalize_city(parsed_json.get("location_city")),
            benefits=self._normalize_benefits(parsed_json.get("benefits")),
            source="llm",
        )

    def _post_generate_content(
        self,
        payload: dict[str, object],
        access_token: str,
        project_id: str,
    ) -> tuple[dict[str, object] | None, str | None]:
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        url = (
            f"https://{self.location}-aiplatform.googleapis.com/v1/"
            f"projects/{project_id}/locations/{self.location}/publishers/google/models/"
            f"{self.model}:generateContent"
        )
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        http_request = request.Request(url=url, data=body, headers=headers, method="POST")

        try:
            with request.urlopen(http_request, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore").strip()
            if detail:
                return None, f"http_{exc.code}: {detail[:240]}"
            return None, f"http_{exc.code}"
        except error.URLError as exc:
            return None, f"network_error: {exc.reason}"

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return None, "invalid_provider_json"

        if not isinstance(parsed, dict):
            return None, "invalid_provider_shape"
        return parsed, None

    def _extract_content(self, provider_response: dict[str, object]) -> str | None:
        candidates = provider_response.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            return None

        first = candidates[0]
        if not isinstance(first, dict):
            return None

        content = first.get("content")
        if not isinstance(content, dict):
            return None

        parts = content.get("parts")
        if not isinstance(parts, list):
            return None

        text_parts: list[str] = []
        for part in parts:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                text_parts.append(part["text"])

        joined = "".join(text_parts).strip()
        return joined or None

    def _parse_model_json(self, content: str) -> tuple[dict[str, object], str | None]:
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            return {}, "invalid_model_json"

        if not isinstance(parsed, dict):
            return {}, "invalid_model_json_shape"
        return parsed, None

    def _normalize_intent(self, intent: object) -> str | None:
        if not isinstance(intent, str):
            return None
        normalized = intent.strip().upper()
        if normalized in {"HOSPITAL", "RAG"}:
            return normalized
        return None

    def _normalize_city(self, location_city: object) -> str | None:
        if not isinstance(location_city, str):
            return None
        candidate = location_city.strip()
        if not candidate:
            return None
        return candidate

    def _normalize_benefits(self, benefits: object) -> list[str]:
        if not isinstance(benefits, list):
            return []

        normalized: list[str] = []
        for benefit in benefits:
            if not isinstance(benefit, str):
                continue
            cleaned = benefit.strip()
            if cleaned:
                normalized.append(cleaned)
        return normalized

    def _system_prompt(self) -> str:
        return (
            "You are a routing and extraction assistant for Nura, a health-benefit literacy chatbot. "
            "Return ONLY valid JSON with keys: intent, location_city, benefits. "
            "intent must be HOSPITAL or RAG or null. "
            "location_city must be a city string or null. "
            "benefits must be an array of strings and may be empty. "
            "Do not provide diagnosis or triage."
        )

    def _get_access_token_and_project(self) -> tuple[str, str, str | None]:
        try:
            credentials, detected_project_id = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        except Exception:
            return "", "", "auth_not_configured"

        try:
            credentials.refresh(Request())
        except Exception as exc:
            return "", "", f"auth_refresh_error: {str(exc)[:200]}"

        access_token = credentials.token
        if not access_token:
            return "", "", "missing_access_token"

        project_id = self.project_id or (detected_project_id or "").strip()
        if not project_id:
            return "", "", "missing_vertex_project_id"

        return access_token, project_id, None
