from models.chat import ServiceResult
from models.session import SessionState
from services.interfaces import HospitalService


class MockHospitalService(HospitalService):
    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        city = session.location_city or "your city"
        benefits_label = ", ".join(session.benefits) if session.benefits else "your benefits"

        hospitals = [
            {
                "name": f"{city} General Hospital",
                "city": city,
                "accreditation": "PhilHealth Accredited",
            },
            {
                "name": f"{city} District Medical Center",
                "city": city,
                "accreditation": "PhilHealth Accredited",
            },
        ]

        return ServiceResult(
            response_type="RECOMMENDATION",
            message=f"Here are mocked accredited hospitals in {city} based on {benefits_label}.",
            data={
                "hospitals": hospitals,
                # TODO [DATA TEAM]: Replace this with real database/recommender logic.
                # Recommended insertion point: services/hospital_service.py::recommend
                "source": "mock-hospital-service",
            },
        )
