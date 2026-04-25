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
  location?: string;
  benefits?: BenefitProfile;
};

export type ChatResponse = {
  session_id: string;
  state: NuraScreen;
  reply: string;
  facilities: Facility[];
  is_emergency: boolean;
};

/** Kept for backward compatibility */
export type ChatState = NuraScreen;
