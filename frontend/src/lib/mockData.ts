import type { Facility } from "../types/facility";
import type { ChatResponse } from "../types/chat";
import type { BenefitProfile } from "../types/benefits";

// ─── Mock facility database ─────────────────────────────────

const MOCK_FACILITIES: Record<string, Facility[]> = {
  "quezon city": [
    {
      id: "fac_001",
      name: "Batasan Hills YAKAP Primary Care Clinic",
      address: "Batasan Road, Brgy. Batasan Hills, Quezon City",
      distance_km: 1.2,
      benefit_to_claim: "PhilHealth YAKAP — Libreng konsultasyon at gamot",
      what_to_say:
        "\"Gusto ko pong magpa-FPE at magpa-empanel sa YAKAP. First time ko po.\"",
      what_to_bring:
        "PhilHealth ID o MDR printout, valid government ID, at barangay certificate kung wala pang PhilHealth",
      hours: "Lunes–Biyernes, 8:00 AM – 5:00 PM",
      maps_url: "https://maps.google.com/?q=14.6869,121.0857",
      data_source: "YAKAP",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: false,
    },
    {
      id: "fac_002",
      name: "East Avenue Medical Center — Malasakit Center",
      address: "East Avenue, Diliman, Quezon City",
      distance_km: 3.8,
      benefit_to_claim: "Malasakit Center — Isang beses lang mag-apply para sa tulong-medikal",
      what_to_say:
        "\"Gusto ko pong mag-apply sa Malasakit Center para sa tulong sa hospital bill ko.\"",
      what_to_bring:
        "PhilHealth MDR, valid ID, barangay certificate, medical abstract o doctor's request, at hospital bill",
      hours: "Lunes–Biyernes, 8:00 AM – 5:00 PM (may Saturday schedule minsan)",
      maps_url: "https://maps.google.com/?q=14.6424,121.0484",
      data_source: "MALASAKIT",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: true,
    },
    {
      id: "fac_003",
      name: "Quezon City Health Department — Novaliches Health Center",
      address: "Novaliches Proper, Quezon City",
      distance_km: 5.1,
      benefit_to_claim: "LGU Free Primary Care — Libre para sa lahat ng residente",
      what_to_say:
        "\"Pa-check up po. Residente po ako ng Quezon City. First time ko po dito.\"",
      what_to_bring:
        "Barangay certificate o proof of residency, at valid ID kung meron",
      hours: "Lunes–Biyernes, 8:00 AM – 4:00 PM",
      maps_url: "https://maps.google.com/?q=14.7154,121.0437",
      data_source: "LGU",
      data_year: 2025,
      data_reliability: "MEDIUM",
      is_emergency_capable: false,
    },
  ],
  manila: [
    {
      id: "fac_004",
      name: "Tondo Medical Center — Malasakit Center",
      address: "Tondo, Manila",
      distance_km: 2.4,
      benefit_to_claim: "Malasakit Center — Tulong-medikal sa isang window",
      what_to_say:
        "\"Gusto ko pong mag-apply sa Malasakit Center. Saan po ang window?\"",
      what_to_bring:
        "PhilHealth MDR, valid ID, barangay certificate, medical abstract",
      hours: "Lunes–Biyernes, 8:00 AM – 5:00 PM",
      maps_url: "https://maps.google.com/?q=14.6123,120.9675",
      data_source: "MALASAKIT",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: true,
    },
    {
      id: "fac_005",
      name: "Manila Health Department — Sampaloc Health Center",
      address: "Sampaloc, Manila",
      distance_km: 1.8,
      benefit_to_claim: "LGU Free Primary Care — Libre ang konsultasyon",
      what_to_say:
        "\"Pa-check up po. Taga-Manila po ako.\"",
      what_to_bring: "Barangay certificate at valid ID",
      hours: "Lunes–Biyernes, 8:00 AM – 4:00 PM",
      maps_url: "https://maps.google.com/?q=14.6042,120.9822",
      data_source: "LGU",
      data_year: 2025,
      data_reliability: "MEDIUM",
      is_emergency_capable: false,
    },
  ],
  "cebu city": [
    {
      id: "fac_006",
      name: "Vicente Sotto Memorial Medical Center — Malasakit Center",
      address: "B. Rodriguez St, Cebu City",
      distance_km: 2.0,
      benefit_to_claim: "Malasakit Center — Isang window para sa tulong",
      what_to_say:
        "\"Gusto ko po mag-apply sa Malasakit Center para sa hospital assistance.\"",
      what_to_bring:
        "PhilHealth MDR, valid ID, barangay certificate, hospital bill, medical abstract",
      hours: "Lunes–Biyernes, 8:00 AM – 5:00 PM",
      maps_url: "https://maps.google.com/?q=10.3057,123.8930",
      data_source: "MALASAKIT",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: true,
    },
  ],
  "davao city": [
    {
      id: "fac_007",
      name: "Southern Philippines Medical Center — Malasakit Center",
      address: "J.P. Laurel Ave, Bajada, Davao City",
      distance_km: 3.2,
      benefit_to_claim: "Malasakit Center — One-stop shop para sa medical assistance",
      what_to_say:
        "\"Pa-apply po sa Malasakit Center. Saan po ang processing?\"",
      what_to_bring:
        "PhilHealth MDR, valid ID, barangay certificate, medical abstract, hospital bill",
      hours: "Lunes–Biyernes, 8:00 AM – 5:00 PM",
      maps_url: "https://maps.google.com/?q=7.0731,125.6128",
      data_source: "MALASAKIT",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: true,
    },
  ],
  caloocan: [
    {
      id: "fac_008",
      name: "Caloocan City Health Office — Main Health Center",
      address: "8th Avenue, Caloocan City",
      distance_km: 1.5,
      benefit_to_claim: "LGU Free Primary Care — Libre para sa mga residente",
      what_to_say: "\"Pa-check up po. Taga-Caloocan po ako.\"",
      what_to_bring: "Barangay certificate at valid ID",
      hours: "Lunes–Biyernes, 8:00 AM – 4:00 PM",
      maps_url: "https://maps.google.com/?q=14.6488,120.9664",
      data_source: "LGU",
      data_year: 2025,
      data_reliability: "MEDIUM",
      is_emergency_capable: false,
    },
  ],
  makati: [
    {
      id: "fac_009",
      name: "Ospital ng Makati",
      address: "Sampaguita St, Brgy. Pembo, Makati City",
      distance_km: 2.1,
      benefit_to_claim: "LGU Free Primary Care + PhilHealth — Libre at covered ang konsultasyon",
      what_to_say:
        "\"Pa-check up po. Taga-Makati po ako. May PhilHealth po ako.\"",
      what_to_bring: "PhilHealth ID, valid ID, proof of Makati residency",
      hours: "24/7 (Emergency), OPD: Lunes–Biyernes 8:00 AM – 5:00 PM",
      maps_url: "https://maps.google.com/?q=14.5547,121.0597",
      data_source: "LGU",
      data_year: 2025,
      data_reliability: "HIGH",
      is_emergency_capable: true,
    },
  ],
};

// ─── Build mock response ────────────────────────────────────

function buildReply(concern: string, location: string, benefits: BenefitProfile): string {
  const hasBenefit = benefits.hasPhilHealth || benefits.hasYakap || benefits.isSenior ||
    benefits.isPwd || benefits.is4ps || benefits.hasPhilcare;

  const benefitNote = hasBenefit
    ? "Base sa mga benefit mo, narito ang mga pasilidad na pwede mong puntahan."
    : "Kahit walang specific benefit, may mga libreng serbisyo sa mga health center sa lugar mo.";

  return `Hindi ako doktor at hindi ito diagnosis, pero base sa sinabi mong "${concern}" at location mo sa ${location} — ${benefitNote} Tingnan ang mga recommended facilities sa baba.`;
}

function matchFacilities(location: string, _benefits: BenefitProfile): Facility[] {
  const normalized = location.toLowerCase().trim();

  for (const [key, facilities] of Object.entries(MOCK_FACILITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return facilities;
    }
  }

  // Fallback to QC if no match
  return MOCK_FACILITIES["quezon city"]!;
}

// ─── Public mock API ────────────────────────────────────────

export async function mockSendChat(
  sessionId: string,
  concern: string,
  location: string,
  benefits: BenefitProfile
): Promise<ChatResponse> {
  // Simulate network delay for realistic demo feel
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const facilities = matchFacilities(location, benefits);
  const reply = buildReply(concern, location, benefits);

  return {
    session_id: sessionId,
    state: "results",
    reply,
    facilities,
    is_emergency: false,
  };
}
