from models.chat import ServiceResult
from models.session import SessionState
from services.interfaces import AIRagService


class MockAIRagService(AIRagService):
    def answer(self, session: SessionState, message: str) -> ServiceResult:
        benefits_label = ", ".join(session.benefits) if session.benefits else "your selected benefits"

        return ServiceResult(
            response_type="RAG_ANSWER",
            message=(
                "This is a mocked RAG response. "
                f"Based on {benefits_label}, you can ask about covered services and claim flow."
            ),
            data={
                "answer": (
                    "Mock answer: PhilHealth commonly covers consultations, selected diagnostics, "
                    "and inpatient support depending on eligibility and facility accreditation."
                ),
                # TODO [AI TEAM]: Replace this with retrieval + generation using your embedding stack.
                # Recommended insertion point: services/ai_rag_service.py::answer
                "source": "mock-ai-rag-service",
            },
        )
