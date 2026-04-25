export const EMERGENCY_KEYWORDS: readonly string[] = [
  "hirap huminga",
  "hindi makahinga",
  "masakit dibdib",
  "pananakit ng dibdib",
  "chest pain",
  "stroke",
  "seizure",
  "kombulsyon",
  "walang malay",
  "unconscious",
  "matinding pagdurugo",
  "severe bleeding",
  "hindi makagalaw",
  "hindi makapagsalita",
  "buntis bleeding",
  "overdose",
  "self harm"
];

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isEmergencyMessage(input: string): boolean {
  const normalized = normalizeText(input);
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
