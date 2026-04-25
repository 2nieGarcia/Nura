import { useState } from "react";
import { BenefitSelector } from "./components/benefits/BenefitSelector";
import { ChatInput } from "./components/chat/ChatInput";
import { ChatWindow } from "./components/chat/ChatWindow";
import { FacilityCard } from "./components/facilities/FacilityCard";
import { AppHeader } from "./components/layout/AppHeader";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { EmergencyBanner } from "./components/safety/EmergencyBanner";
import { APP_COPY, DEFAULT_BENEFITS } from "./constants/app";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSessionId } from "./hooks/useSessionId";
import { sendChatMessage } from "./lib/api";
import { isEmergencyMessage } from "./lib/emergency";
import type { BenefitProfile } from "./types/benefits";
import type { ChatMessage, ChatState } from "./types/chat";
import type { Facility } from "./types/facility";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

function hasBenefitSelection(benefits: BenefitProfile): boolean {
  return Object.values(benefits).some(Boolean);
}

export default function App(): JSX.Element {
  const sessionId = useSessionId();
  const isOnline = useOnlineStatus();

  const [chatState, setChatState] = useState<ChatState>("asking_symptom");
  const [messageInput, setMessageInput] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  const [benefits, setBenefits] = useState<BenefitProfile>(DEFAULT_BENEFITS);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", APP_COPY.startupMessage)
  ]);

  const handleSubmit = async (): Promise<void> => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage) {
      return;
    }

    setError(null);
    setMessages((current) => [...current, createMessage("user", trimmedMessage)]);
    setMessageInput("");

    if (isEmergencyMessage(trimmedMessage)) {
      setIsEmergency(true);
      setChatState("emergency");
      setFacilities([]);
      setMessages((current) => [...current, createMessage("assistant", APP_COPY.emergencyMessage)]);
      return;
    }

    setIsLoading(true);
    setChatState("loading");

    try {
      const response = await sendChatMessage({
        session_id: sessionId,
        message: trimmedMessage,
        location: locationInput.trim() || undefined,
        benefits: hasBenefitSelection(benefits) ? benefits : undefined
      });

      setChatState(response.state);
      setIsEmergency(response.is_emergency);
      setFacilities(response.facilities);
      setMessages((current) => [...current, createMessage("assistant", response.reply)]);
    } catch {
      setChatState("error");
      setError("May problema sa server connection. Subukan ulit mamaya.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-service-bg px-4 py-6 text-service-text">
      <div className="mx-auto max-w-6xl space-y-4">
        <AppHeader />
        <OfflineBanner isOnline={isOnline} />
        {isEmergency ? <EmergencyBanner /> : null}

        {error ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
            {error}
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.35fr,1fr]">
          <section>
            <ChatWindow messages={messages} isLoading={isLoading} />
            <ChatInput
              value={messageInput}
              disabled={isLoading}
              onChange={setMessageInput}
              onSubmit={() => {
                void handleSubmit();
              }}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
              <label htmlFor="location" className="block text-sm font-semibold text-slate-800">
                City or barangay
              </label>
              <input
                id="location"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-service-accent focus:outline-none focus:ring-2 focus:ring-cyan-100"
                placeholder="Halimbawa: Quezon City"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
              />
              <p className="mt-2 text-xs text-slate-600">Current state: {chatState}</p>
            </section>

            <BenefitSelector value={benefits} disabled={isLoading} onChange={setBenefits} />

            <section className="space-y-3" aria-label="Facility results">
              {facilities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                  Wala pang facility results. I-send ang concern mo para makakuha ng initial guidance.
                </div>
              ) : (
                facilities.map((facility, index) => (
                  <FacilityCard key={facility.id ?? `${facility.name}-${index}`} facility={facility} />
                ))
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
