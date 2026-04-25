import type { BenefitProfile } from "../types/benefits";

export const APP_COPY = {
  title: "Nura",
  subtitle: "Hindi doktor. Gabay sa tamang pasilidad at benepisyo.",
  offlineWarning:
    "Mahina o walang connection. Ipapakita muna namin ang huling na-save na resulta kung mayroon.",
  emergencyMessage:
    "EMERGENCY ITO. Tumawag agad sa 911 o pumunta sa pinakamalapit na Emergency Room. Hindi sapat ang chatbot para sa ganitong sintomas.",
  startupMessage:
    "Hindi ako doktor, pero tutulungan kitang hanapin kung saan ka pwedeng magpatingin at anong benepisyo ang pwede mong gamitin."
} as const;

export const DEFAULT_BENEFITS: BenefitProfile = {
  hasYakap: false,
  hasPhilHealth: false,
  isSenior: false,
  isPwd: false,
  is4ps: false,
  hasPhilcare: false,
  noBenefits: false
};
