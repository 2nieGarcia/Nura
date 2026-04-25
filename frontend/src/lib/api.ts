import type { ChatRequest, ChatResponse } from "../types/chat";
import type { BenefitProfile } from "../types/benefits";
import { mockSendChat } from "./mockData";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * When VITE_API_URL is set, sends to real backend.
 * When empty (default for demo), uses local mock data.
 *
 * To switch to real backend later:
 * 1. Set VITE_API_URL=https://your-backend.run.app in .env
 * 2. This function automatically routes to the real endpoint
 */
export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  // If no API URL configured, use mock
  if (!API_URL) {
    return mockSendChat(
      payload.session_id,
      payload.message,
      payload.location ?? "Quezon City",
      payload.benefits ?? {
        hasYakap: false,
        hasPhilHealth: false,
        isSenior: false,
        isPwd: false,
        is4ps: false,
        hasPhilcare: false,
        noBenefits: true,
      }
    );
  }

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Hindi makakonekta sa server ngayon.");
  }

  return (await response.json()) as ChatResponse;
}

/**
 * Convenience wrapper for the stepped flow.
 * Assembles ChatRequest from individual collected values.
 */
export async function submitNavigation(
  sessionId: string,
  concern: string,
  location: string,
  benefits: BenefitProfile
): Promise<ChatResponse> {
  return sendChatMessage({
    session_id: sessionId,
    message: concern,
    location,
    benefits,
  });
}
