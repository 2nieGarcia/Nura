export type BenefitType =
  | "YAKAP"
  | "PHILHEALTH"
  | "SENIOR"
  | "PWD"
  | "FOUR_PS"
  | "PHILCARE"
  | "NONE";

export type BenefitProfile = {
  hasYakap: boolean;
  hasPhilHealth: boolean;
  isSenior: boolean;
  isPwd: boolean;
  is4ps: boolean;
  hasPhilcare: boolean;
  noBenefits: boolean;
};
