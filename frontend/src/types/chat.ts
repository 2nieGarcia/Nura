import type { BenefitProfile } from "./benefits";
import type { Facility } from "./facility";

export type NuraScreen =
  | "welcome"
  | "concern"
  | "location"
  | "benefits"
  | "loading"
  | "results"
  | "emergency";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatRequest = {
  session_id: string;
  message: string;
  concern?: string;
  language?: string;
  location_city?: string;
  benefits?: string[];
  intent?: "HOSPITAL" | "RAG";
};

export type BackendSessionSnapshot = {
  id: string;
  language?: string | null;
  location_city?: string | null;
  benefits?: string[];
  expires_at?: string | null;
};

export type ChatResponse = {
  session_id: string;
  state: NuraScreen;
  reply: string;
  facilities: Facility[];
  is_emergency: boolean;
  response_type?: "EMERGENCY" | "FOLLOW_UP" | "RECOMMENDATION" | "RAG_ANSWER";
  missing_fields?: string[];
  session?: BackendSessionSnapshot;
};

export type SessionCreateResponse = {
  session_id: string;
  expires_at: string;
};

export type BackendChatResponse = {
  session_id: string;
  response_type: "EMERGENCY" | "FOLLOW_UP" | "RECOMMENDATION" | "RAG_ANSWER";
  message: string;
  data: Record<string, unknown>;
  missing_fields: string[];
};

/** Kept for backward compatibility */
export type ChatState = NuraScreen;
