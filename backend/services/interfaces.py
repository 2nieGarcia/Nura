from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Literal

from models.chat import ServiceResult
from models.session import SessionState


class EmergencyClassifier(ABC):
    @abstractmethod
    def matched_keywords(self, message: str) -> list[str]:
        raise NotImplementedError


class HospitalService(ABC):
    @abstractmethod
    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        raise NotImplementedError


class AIRagService(ABC):
    @abstractmethod
    def answer(self, session: SessionState, message: str) -> ServiceResult:
        raise NotImplementedError


@dataclass(slots=True)
class InferenceResult:
    intent: Literal["HOSPITAL", "RAG"] | None = None
    location_city: str | None = None
    benefits: list[str] = field(default_factory=list)
    source: str = "disabled"
    error: str | None = None


class OrchestratorInferenceService(ABC):
    @abstractmethod
    def infer(self, session: SessionState, message: str) -> InferenceResult:
        raise NotImplementedError
