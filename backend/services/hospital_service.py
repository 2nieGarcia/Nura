from models.chat import ServiceResult
from models.session import SessionState
from services.interfaces import HospitalService


class MockHospitalService(HospitalService):
    def recommend(self, session: SessionState, message: str) -> ServiceResult:
        city = session.location_city or "your city"
        benefits_label = ", ".join(session.benefits) if session.benefits else "your benefits"
        if session.language == "en":
            reply = f"Here are mocked accredited hospitals in {city} based on {benefits_label}."
        else:
            reply = (
                f"Nahanap ko ang mocked accredited facilities sa {city} "
                f"base sa {benefits_label}."
            )

        # TODO [DATA TEAM]: Replace these placeholder records with the real
        # hospital/facility recommender output once the cleaned dataset lands.
        facilities = [
            {
                "name": f"{city} General Hospital",
                "address": f"{city} public hospital district",
                "distance_km": 2.4,
                "accreditation": "PhilHealth Accredited",
                "benefit_to_claim": f"{benefits_label} - ask the billing or PhilHealth desk to verify coverage.",
                "what_to_say": f"Pa-check up po para sa {message}. May {benefits_label} po ako.",
                "what_to_bring": "Valid ID, PhilHealth ID or MDR if available, and any doctor's request or previous records.",
                "hours": "Call facility to confirm current OPD hours.",
                "maps_url": f"https://maps.google.com/?q={city.replace(' ', '+')}+General+Hospital",
                "latitude": 14.6760,
                "longitude": 121.0437,
                "data_source": "LGU",
                "data_year": 2026,
                "data_reliability": "LOW",
                "is_emergency_capable": True,
            },
            {
                "name": f"{city} District Medical Center",
                "address": f"{city} district health facility",
                "distance_km": 4.8,
                "accreditation": "PhilHealth Accredited",
                "benefit_to_claim": f"{benefits_label} - confirm accepted benefits before going.",
                "what_to_say": f"May {benefits_label} po ako. Saan po pwede magpa-assess para sa concern ko?",
                "what_to_bring": "Valid ID, benefit card or proof if available, and any relevant medical documents.",
                "hours": "Call facility to confirm current OPD hours.",
                "maps_url": f"https://maps.google.com/?q={city.replace(' ', '+')}+District+Medical+Center",
                "latitude": 14.6500,
                "longitude": 121.0500,
                "data_source": "LGU",
                "data_year": 2026,
                "data_reliability": "LOW",
                "is_emergency_capable": False,
            },
        ]

        return ServiceResult(
            response_type="RECOMMENDATION",
            message=reply,
            data={
                "facilities": facilities,
                "hospitals": facilities,
                "source": "mock-hospital-service",
            },
        )
