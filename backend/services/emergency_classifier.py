import json
from pathlib import Path

from services.interfaces import EmergencyClassifier


class KeywordEmergencyClassifier(EmergencyClassifier):
    def __init__(self, keywords_path: Path) -> None:
        self.keywords_path = keywords_path
        self.keywords = self._load_keywords()

    def matched_keywords(self, message: str) -> list[str]:
        normalized = message.lower()
        matches = [keyword for keyword in self.keywords if keyword in normalized]
        return sorted(set(matches))

    def _load_keywords(self) -> list[str]:
        if not self.keywords_path.exists():
            raise FileNotFoundError(
                f"Emergency keyword file not found at: {self.keywords_path}"
            )

        raw = json.loads(self.keywords_path.read_text(encoding="utf-8"))
        keywords: set[str] = set(raw.get("global", []))

        by_language = raw.get("by_language", {})
        for terms in by_language.values():
            if isinstance(terms, list):
                keywords.update(terms)

        return sorted(
            term.strip().lower()
            for term in keywords
            if isinstance(term, str) and term.strip()
        )
