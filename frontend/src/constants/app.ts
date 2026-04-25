import type { BenefitProfile } from "../types/benefits";

// ─── App copy ───────────────────────────────────────────────

export const APP_COPY = {
  title: "Nura",
  subtitle: "Hindi doktor. Gabay sa tamang pasilidad at benepisyo.",
  tagline: "Tulungan kitang malaman kung saan ka pwedeng magpatingin, anong benefit ang pwede mong gamitin, at ano ang dadalhin mo.",
  privacyNote: "Walang account needed. Walang data na sine-save.",
  ctaStart: "Ano ang concern mo?",
  emergencyMessage:
    "EMERGENCY ITO. Tumawag agad sa 911 o pumunta sa pinakamalapit na Emergency Room. Hindi sapat ang chatbot para sa ganitong sintomas.",
  emergencyNotReally: "Hindi naman emergency? Bumalik.",
  offlineWarning:
    "Mahina o walang connection. Ipapakita ang huling na-save na resulta kung mayroon.",
  offlineNoCache: "Walang connection at walang naka-save na resulta. Subukan ulit mamaya.",
  loadingText: "Hinahanap ang pinakamalapit na pasilidad...",
  noResults: "Walang nakitang pasilidad sa lugar na ito. Subukan ang ibang location.",
  resetButton: "Mag-search ulit",
  concernLabel: "Ilarawan ang concern o sintomas mo",
  concernPlaceholder: "Halimbawa: Masakit ulo ko, 3 days na",
  concernHint: "O pumili sa mga common concern sa baba:",
  locationLabel: "Saan ka malapit?",
  locationPlaceholder: "City o barangay",
  locationHint: "O pumili:",
  benefitLabel: "May benefit ka ba?",
  benefitHint: "Piliin lahat ng applicable. Okay lang kung hindi sure.",
  benefitSubmit: "Hanapin ang pasilidad",
  nextButton: "Susunod",
  noBenefitNote: "Kahit walang benefit, may libreng serbisyo sa mga health center.",
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

// ─── Benefit card data ──────────────────────────────────────

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
    description: "Konsultasyon, laboratory, at confinement coverage sa accredited facilities.",
  },
  {
    key: "hasYakap",
    label: "YAKAP",
    description: "Libreng konsultasyon at gamot sa napiling primary care provider.",
  },
  {
    key: "isSenior",
    label: "Senior Citizen",
    description: "20% discount sa gamot at serbisyo, plus priority lane.",
  },
  {
    key: "isPwd",
    label: "PWD",
    description: "20% discount sa gamot, medical, at dental services.",
  },
  {
    key: "is4ps",
    label: "4Ps",
    description: "Priority access sa health center at free health services.",
  },
  {
    key: "hasPhilcare",
    label: "PhilCare HMO",
    description: "Coverage sa accredited hospitals at clinics. I-check ang plan mo.",
  },
  {
    key: "noBenefits",
    label: "Wala / Hindi sure",
    description: "May libreng options pa rin sa mga health center.",
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

// ─── Step labels for indicator ──────────────────────────────

export const STEP_LABELS: readonly string[] = [
  "Concern",
  "Location",
  "Benefit",
  "Results",
];
