EMERGENCY_KEYWORDS: tuple[str, ...] = (
    "hirap huminga",
    "hindi makahinga",
    "masakit dibdib",
    "pananakit ng dibdib",
    "chest pain",
    "stroke",
    "seizure",
    "kombulsyon",
    "walang malay",
    "unconscious",
    "matinding pagdurugo",
    "severe bleeding",
    "hindi makagalaw",
    "hindi makapagsalita",
    "buntis bleeding",
    "overdose",
    "self harm",
)


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def is_emergency_message(text: str) -> bool:
    normalized = normalize_text(text)
    return any(keyword in normalized for keyword in EMERGENCY_KEYWORDS)
