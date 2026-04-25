import { useState } from "react";

const STORAGE_KEY = "nura.session_id";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useSessionId(): string {
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const generated = createSessionId();
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  });

  return sessionId;
}
