import re
from typing import Final, Literal

DialectOnly = Literal[
    "tagalog",
    "cebuano",
    "ilocano",
    "hiligaynon",
    "waray",
    "kapampangan",
    "bikol",
]
LanguageProfile = Literal[
    "tagalog",
    "cebuano",
    "ilocano",
    "hiligaynon",
    "waray",
    "kapampangan",
    "bikol",
    "mixed",
    "english",
    "filipino_simple",
]

DIALECT_MARKERS: Final[dict[DialectOnly, tuple[str, ...]]] = {
    "tagalog": ("ako", "nasa", "saan", "masakit", "po"),
    "cebuano": ("unsa", "akoang", "asa", "sakit", "nimo"),
    "ilocano": ("anya", "agbiag", "adda", "sakit", "ka"),
    "hiligaynon": ("diin", "masakit", "gid", "akon", "karon"),
    "waray": ("hain", "ak", "masakit", "kaupay", "hini"),
    "kapampangan": ("nanu", "nuku", "masakit", "ing", "kaku"),
    "bikol": ("ano", "sain", "masakit", "ako", "ngonian"),
}

ENGLISH_HINTS: Final[set[str]] = {
    "i",
    "my",
    "pain",
    "chest",
    "help",
    "where",
    "clinic",
    "doctor",
    "benefit",
    "health",
    "for",
    "with",
    "and",
    "the",
    "need",
    "please",
}

FILIPINO_HINTS: Final[set[str]] = {
    "ako",
    "ko",
    "po",
    "nasa",
    "masakit",
    "saan",
    "paano",
    "walang",
    "may",
    "lang",
    "kailangan",
    "pakicheck",
}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def detect_language_profile(text: str) -> LanguageProfile:
    tokens = _tokenize(text)
    if not tokens:
        return "filipino_simple"

    dialect_scores = {
        dialect: sum(1 for token in tokens if token in markers)
        for dialect, markers in DIALECT_MARKERS.items()
    }
    top_dialect, top_score = max(dialect_scores.items(), key=lambda item: item[1])

    english_score = sum(1 for token in tokens if token in ENGLISH_HINTS)
    filipino_score = sum(1 for token in tokens if token in FILIPINO_HINTS)

    if english_score >= max(4, len(tokens) // 2) and filipino_score == 0 and top_score == 0:
        return "english"

    if english_score > 0 and (filipino_score > 0 or top_score > 0):
        return "mixed"

    if top_score > 0:
        return top_dialect

    return "filipino_simple"


def select_response_language(text: str) -> Literal["en", "fil"]:
    profile = detect_language_profile(text)

    if profile == "english":
        return "en"

    return "fil"
