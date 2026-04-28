import type { BenefitProfile } from "../types/benefits";
import type {
  BackendSessionSnapshot,
  BackendChatResponse,
  ChatRequest,
  ChatResponse,
  SessionCreateResponse,
} from "../types/chat";
import type { Facility, FacilitySource } from "../types/facility";
import { mockSendChat } from "./mockData";

const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1";
const API_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";
const SESSION_STORAGE_KEY = "nura.api_session_id";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function fallbackSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredSessionId(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Storage can be unavailable in private webviews; keep the in-memory flow working.
  }
}

function clearStoredSessionId(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string") return payload.detail;
  } catch {
    // Fall through to generic message.
  }

  return "Hindi makakonekta sa Nura backend ngayon.";
}

export async function createSession(language?: string): Promise<SessionCreateResponse> {
  if (USE_MOCK_API) {
    const sessionId = fallbackSessionId();
    return {
      session_id: sessionId,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  const response = await fetch(`${API_URL}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  const session = (await response.json()) as SessionCreateResponse;
  setStoredSessionId(session.session_id);
  return session;
}

export async function ensureSessionId(
  currentSessionId?: string | null,
  language = "fil"
): Promise<string> {
  if (USE_MOCK_API) {
    const sessionId = currentSessionId ?? getStoredSessionId() ?? fallbackSessionId();
    setStoredSessionId(sessionId);
    return sessionId;
  }

  const sessionId = currentSessionId ?? getStoredSessionId();
  if (sessionId) return sessionId;

  const session = await createSession(language);
  return session.session_id;
}

function benefitsToLabels(benefits: BenefitProfile): string[] {
  const labels: string[] = [];

  if (benefits.noBenefits) return ["No Declared Benefits"];
  if (benefits.hasPhilHealth) labels.push("PhilHealth");
  if (benefits.hasYakap) labels.push("YAKAP");
  if (benefits.isSenior) labels.push("Senior Citizen");
  if (benefits.isPwd) labels.push("PWD");
  if (benefits.is4ps) labels.push("4Ps");
  if (benefits.hasPhilcare) labels.push("PhilCare HMO");

  return labels.length > 0 ? labels : ["No Declared Benefits"];
}

function isFacilitySource(value: unknown): value is FacilitySource {
  return (
    value === "YAKAP" ||
    value === "MALASAKIT" ||
    value === "LGU" ||
    value === "OSM" ||
    value === "GOOGLE_MAPS" ||
    value === "PHILCARE_2024"
  );
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toFacility(raw: unknown, index: number): Facility | null {
  if (typeof raw !== "object" || raw === null) return null;

  const value = raw as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name : "";
  if (!name) return null;

  const city = typeof value.city === "string" ? value.city : "";
  const address = typeof value.address === "string" ? value.address : city || "Address to confirm";
  const accreditation =
    typeof value.accreditation === "string" ? value.accreditation : undefined;

  return {
    id: typeof value.id === "string" ? value.id : `backend-facility-${index}`,
    name,
    address,
    distance_km:
      typeof value.distance_km === "number" ? value.distance_km : undefined,
    benefit_to_claim:
      typeof value.benefit_to_claim === "string"
        ? value.benefit_to_claim
        : accreditation,
    what_to_say:
      typeof value.what_to_say === "string" ? value.what_to_say : undefined,
    what_to_bring:
      typeof value.what_to_bring === "string" ? value.what_to_bring : undefined,
    hours: typeof value.hours === "string" ? value.hours : undefined,
    maps_url: typeof value.maps_url === "string" ? value.maps_url : undefined,
    latitude: toOptionalNumber(value.latitude ?? value.lat),
    longitude: toOptionalNumber(value.longitude ?? value.lng),
    data_source: isFacilitySource(value.data_source) ? value.data_source : "LGU",
    data_year: typeof value.data_year === "number" ? value.data_year : undefined,
    data_reliability:
      value.data_reliability === "HIGH" ||
      value.data_reliability === "MEDIUM" ||
      value.data_reliability === "LOW"
        ? value.data_reliability
        : "LOW",
    is_emergency_capable:
      typeof value.is_emergency_capable === "boolean"
        ? value.is_emergency_capable
        : undefined,
  };
}

function getBackendFacilities(data: Record<string, unknown>): Facility[] {
  const rawFacilities = Array.isArray(data.facilities)
    ? data.facilities
    : Array.isArray(data.hospitals)
      ? data.hospitals
      : [];

  return rawFacilities
    .map((raw, index) => toFacility(raw, index))
    .filter((facility): facility is Facility => facility !== null);
}

function getBackendSession(data: Record<string, unknown>): BackendSessionSnapshot | undefined {
  const raw = data.session;
  if (typeof raw !== "object" || raw === null) return undefined;

  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string") return undefined;

  return {
    id: value.id,
    language: typeof value.language === "string" ? value.language : null,
    location_city:
      typeof value.location_city === "string" ? value.location_city : null,
    benefits: Array.isArray(value.benefits)
      ? value.benefits.filter((benefit): benefit is string => typeof benefit === "string")
      : [],
    expires_at: typeof value.expires_at === "string" ? value.expires_at : null,
  };
}

function normalizeBackendResponse(response: BackendChatResponse): ChatResponse {
  return {
    session_id: response.session_id,
    state:
      response.response_type === "EMERGENCY"
        ? "emergency"
        : response.response_type === "FOLLOW_UP"
          ? "concern"
          : "results",
    reply: response.message,
    facilities: getBackendFacilities(response.data),
    is_emergency: response.response_type === "EMERGENCY",
    response_type: response.response_type,
    missing_fields: response.missing_fields,
    session: getBackendSession(response.data),
  };
}

async function postChat(payload: ChatRequest): Promise<BackendChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  return (await response.json()) as BackendChatResponse;
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK_API) {
    return mockSendChat(
      payload.session_id,
      payload.message,
      payload.location_city ?? "Quezon City",
      {
        hasYakap: payload.benefits?.includes("YAKAP") ?? false,
        hasPhilHealth: payload.benefits?.includes("PhilHealth") ?? false,
        isSenior: payload.benefits?.includes("Senior Citizen") ?? false,
        isPwd: payload.benefits?.includes("PWD") ?? false,
        is4ps: payload.benefits?.includes("4Ps") ?? false,
        hasPhilcare: payload.benefits?.includes("PhilCare HMO") ?? false,
        noBenefits: payload.benefits?.includes("No Declared Benefits") ?? true,
      },
      payload.language
    );
  }

  return normalizeBackendResponse(await postChat(payload));
}

type SubmitChatTurnInput = {
  message: string;
  concern?: string;
  location?: string;
  benefits?: BenefitProfile;
  language?: string;
  intent?: "HOSPITAL" | "RAG";
};

export async function submitChatTurn(
  sessionId: string | null,
  input: SubmitChatTurnInput
): Promise<ChatResponse> {
  const language = input.language ?? "fil";
  const request = async (activeSessionId: string): Promise<ChatResponse> =>
    sendChatMessage({
      session_id: activeSessionId,
      message: input.message,
      concern: input.concern,
      language,
      location_city: input.location,
      benefits: input.benefits ? benefitsToLabels(input.benefits) : undefined,
      intent: input.intent,
    });

  const activeSessionId = await ensureSessionId(sessionId, language);

  try {
    const response = await request(activeSessionId);
    setStoredSessionId(response.session_id);
    return response;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
      clearStoredSessionId();
      const replacement = await createSession(language);
      const response = await request(replacement.session_id);
      setStoredSessionId(response.session_id);
      return response;
    }

    throw error;
  }
}

export async function submitNavigation(
  sessionId: string | null,
  concern: string,
  location: string,
  benefits: BenefitProfile,
  language = "fil"
): Promise<ChatResponse> {
  return submitChatTurn(sessionId, {
    message: concern,
    location,
    benefits,
    language,
    intent: "HOSPITAL",
  });
}
