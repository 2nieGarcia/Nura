import type { BenefitProfile } from "./benefits";
import type { Facility } from "./facility";

export type ChatState =
  | "idle"
  | "asking_symptom"
  | "asking_location"
  | "asking_benefits"
  | "loading"
  | "results"
  | "emergency"
  | "error";

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
  state: ChatState;
  reply: string;
  facilities: Facility[];
  is_emergency: boolean;
};
