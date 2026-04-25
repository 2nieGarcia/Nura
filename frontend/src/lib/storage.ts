import type { Facility } from "../types/facility";
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  type LanguageCode,
} from "../types/language";

const STORAGE_KEY = "nura.cached_results";
const CARE_PASS_KEY = "nura.care_pass";
const LANGUAGE_KEY = "nura.language";
const CARE_PASS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CachedResults = {
  facilities: Facility[];
  reply: string;
  timestamp: number;
};

export type CarePass = {
  concern: string;
  location: string;
  benefitsSummary: string;
  facilityName: string;
  facilityAddress: string;
  whatToBring: string | null;
  whatToSay: string | null;
  benefitToClaim: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  explanation: string;
  savedAt: number;
  dataSource: string;
};

export function cacheResults(facilities: Facility[], reply: string): void {
  try {
    const data: CachedResults = {
      facilities,
      reply,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or unavailable — silently fail
  }
}

export function getCachedResults(): CachedResults | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as CachedResults;

    // Expire after 24 hours
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > ONE_DAY) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearCachedResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function saveCarePass(pass: CarePass): void {
  try {
    localStorage.setItem(CARE_PASS_KEY, JSON.stringify(pass));
  } catch {
    // silently fail
  }
}

export function getCarePass(): CarePass | null {
  try {
    const raw = localStorage.getItem(CARE_PASS_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as CarePass;
    if (typeof data.savedAt !== "number") {
      localStorage.removeItem(CARE_PASS_KEY);
      return null;
    }

    if (Date.now() - data.savedAt > CARE_PASS_TTL_MS) {
      localStorage.removeItem(CARE_PASS_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearCarePass(): void {
  try {
    localStorage.removeItem(CARE_PASS_KEY);
  } catch {
    // silently fail
  }
}

export function getStoredLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    return raw && isLanguageCode(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveStoredLanguage(language: LanguageCode): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // silently fail
  }
}
