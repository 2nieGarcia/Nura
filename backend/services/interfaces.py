from abc import ABC, abstractmethod

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
