import type { BenefitProfile } from "../types/benefits";

/**
 * App copy lives here so a non-coder can edit microcopy in one file before
 * the demo. Keys are stable; values updated to match the new "Health Desk"
 * design language (less assistant-flavored, more clinic-form-flavored).
 */
export const APP_COPY = {
  title: "Nura",
  subtitle: "Hindi doktor. Gabay sa pasilidad at benepisyo.",
  tagline:
    "Tutulong kaming malaman kung saan ka pwedeng magpatingin, anong benefit ang pwede mong gamitin, at ano ang sasabihin mo sa front desk.",
  privacyNote:
    "Walang account. Sa device mo lang naka-save ang usapan at Last Care Pass.",
  ctaStart: "Magsimula",

  emergencyMessage:
    "EMERGENCY ITO. Tumawag agad sa 911 o pumunta sa pinakamalapit na Emergency Room. Hindi sapat ang chatbot para sa ganitong sintomas.",
  emergencyNotReally: "Hindi pala emergency, bumalik",

  offlineWarning:
    "Mahina o walang connection. Ipapakita ang huling na-save na resulta kung mayroon.",
  offlineNoCache:
    "Walang connection at walang naka-save na resulta. Subukan ulit kapag may signal.",

  loadingText:
    "Tinitingnan ang mga health center na tumatanggap ng iyong benefit.",
  noResults:
    "Wala muna kaming verified facility record sa lugar na ito. Pwede kang maghanap sa Maps at i-confirm sa LGU health office o PhilHealth desk.",
  resetButton: "Mag-search ulit",

  concernLabel: "Ilarawan ang concern o sintomas mo",
  concernPlaceholder: "Halimbawa: Masakit ulo ko, 3 araw na",
  concernHint: "O pumili sa madalas:",

  locationLabel: "Saan ka malapit?",
  locationPlaceholder: "City o barangay",
  locationHint: "O pumili ng city:",

  benefitLabel: "May benefit ka ba?",
  benefitHint:
    "Piliin lahat ng applicable. Okay lang kung hindi sure - may libre pa ring options sa health center.",
  benefitSubmit: "Hanapin ang pasilidad",
  nextButton: "Susunod",
  noBenefitNote:
    "Okay rin yan. Sa health center ng LGU mo, libre ang konsultasyon kahit walang PhilHealth.",
} as const;

// ─── Quick-tap chips ────────────────────────────────────────

export const CONCERN_CHIPS: readonly string[] = [
  "Masakit ulo",
  "Lagnat",
  "Ubo at sipon",
  "Masakit tiyan",
  "Check-up lang",
  "Masakit mata",
  "Skin rashes",
  "Prenatal check-up",
];

export const LOCATION_CHIPS: readonly string[] = [
  "Quezon City",
  "Manila",
  "Cebu City",
  "Davao City",
  "Caloocan",
  "Makati",
];

// ─── Benefit option metadata ────────────────────────────────

export type BenefitOption = {
  key: keyof BenefitProfile;
  label: string;
  description: string;
  isNone?: boolean;
};

export const BENEFIT_OPTIONS: readonly BenefitOption[] = [
  {
    key: "hasPhilHealth",
    label: "PhilHealth",
    description:
      "Konsultasyon, lab, at confinement coverage sa accredited facilities.",
  },
  {
    key: "hasYakap",
    label: "YAKAP",
    description:
      "Libreng konsultasyon at gamot sa napiling primary care provider.",
  },
  {
    key: "isSenior",
    label: "Senior Citizen",
    description: "20% discount sa gamot at serbisyo, may priority lane.",
  },
  {
    key: "isPwd",
    label: "PWD",
    description: "20% discount sa gamot, medical, at dental services.",
  },
  {
    key: "is4ps",
    label: "4Ps",
    description: "Priority access sa health center at libreng serbisyo.",
  },
  {
    key: "hasPhilcare",
    label: "PhilCare HMO",
    description:
      "Coverage sa accredited hospitals at clinics - i-check ang plan mo.",
  },
  {
    key: "noBenefits",
    label: "Wala / hindi sure",
    description: "Okay lang. May libreng options pa rin sa health center.",
    isNone: true,
  },
];

// ─── Default benefit state ──────────────────────────────────

export const DEFAULT_BENEFITS: BenefitProfile = {
  hasYakap: false,
  hasPhilHealth: false,
  isSenior: false,
  isPwd: false,
  is4ps: false,
  hasPhilcare: false,
  noBenefits: false,
};

// ─── Step labels (kept for backward compat; no longer rendered) ──────────
export const STEP_LABELS: readonly string[] = [
  "Concern",
  "Location",
  "Benefit",
  "Results",
];
