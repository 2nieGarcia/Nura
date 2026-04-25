import type { Facility } from "../types/facility";

const STORAGE_KEY = "nura.cached_results";

type CachedResults = {
  facilities: Facility[];
  reply: string;
  timestamp: number;
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
