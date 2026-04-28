import { useEffect, useState } from "react";
import { APP_COPY } from "../../constants/app";
import { getDirectionsUrl, getFacilityCoordinates } from "../../lib/maps";
import type {
  ChatMessage,
  NuraChatActions,
  NuraChatState,
} from "../../lib/useNuraChat";
import { AlternateRow, PrimaryRecommendation } from "../ui/FacilityCard";
import { BenefitPickerCard } from "./BenefitPickerCard";
import { BotBubble } from "./BotBubble";
import { CarePassCard } from "./CarePassCard";
import { QuickReplies } from "./QuickReplies";
import { TypingIndicator } from "./TypingIndicator";
import { UserBubble } from "./UserBubble";

type ChatMessageItemProps = {
  message: ChatMessage;
  state: NuraChatState;
  actions: NuraChatActions;
};

function latestMessageIdOfType(
  messages: readonly ChatMessage[],
  type: ChatMessage["type"]
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.type === type) return message.id;
  }

  return null;
}

function ResultsBlock({
  message,
}: {
  message: Extract<ChatMessage, { type: "results" }>;
}): JSX.Element {
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [primary, ...alternates] = message.facilities;
  const locationMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `hospitals in ${message.location || "my area"}`
  )}`;
  const primaryDirectionsUrl = primary
    ? getDirectionsUrl(getFacilityCoordinates(primary), primary.maps_url)
    : null;
  const shareText = primary
    ? [
        `Concern: ${message.concern || "Hindi nailagay"}`,
        `Location: ${message.location || "Hindi nailagay"}`,
        `Benefits used: ${message.benefitsSummary || "Wala / hindi sure"}`,
        "",
        `Primary facility: ${primary.name}`,
        `Address: ${primary.address}`,
        `What to bring: ${primary.what_to_bring || "I-confirm sa pasilidad"}`,
        `What to say: ${primary.what_to_say || "Magpa-assist sa front desk"}`,
        `Google Maps directions: ${primaryDirectionsUrl || primary.maps_url || "Walang available na link"}`,
        "",
        "— Galing sa Nura (hindi medical advice)",
      ].join("\n")
    : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    if (!showCopiedToast) return undefined;

    const timerId = window.setTimeout(() => {
      setShowCopiedToast(false);
    }, 2000);

    return () => window.clearTimeout(timerId);
  }, [showCopiedToast]);

  async function handleCopyShare(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.clipboard || !shareText) {
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setShowCopiedToast(true);
  }

  return (
    <div className="message-enter w-full max-w-[30rem] space-y-3 self-stretch">
      {message.error ? (
        <div
          role="alert"
          className="rounded-form border border-mark/40 bg-mark-bg px-4 py-3 text-body text-ink"
        >
          <p className="font-semibold">Hindi natuloy ang paghahanap</p>
          {message.error}
        </div>
      ) : primary ? (
        <PrimaryRecommendation facility={primary} concern={message.concern} />
      ) : (
        <div className="rounded-form border border-paper-edge bg-card px-4 py-4 text-body text-ink">
          <p className="font-semibold">Walang nahanap na pasilidad</p>
          <p className="mt-1 text-ink-soft">{APP_COPY.noResults}</p>
          <a
            id={`search-maps-${message.id}`}
            href={locationMapsSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-form bg-seal px-4 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press"
          >
            Maghanap sa Maps
          </a>
        </div>
      )}

      {alternates.length > 0 && (
        <div className="rounded-form border border-paper-edge bg-card px-4 py-3">
          <p className="font-mono text-label uppercase text-ink-soft">
            Iba pang pwede
          </p>
          <ul className="mt-2">
            {alternates.map((facility, index) => (
              <AlternateRow
                key={facility.id ?? `${facility.name}-${index}`}
                facility={facility}
              />
            ))}
          </ul>
        </div>
      )}

      {primary && !message.error && (
        <div className="rounded-form border border-paper-edge bg-card px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              id={`share-copy-${message.id}`}
              type="button"
              onClick={() => {
                void handleCopyShare();
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-form bg-seal px-3 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press"
            >
              📤 I-share
            </button>
            <a
              id={`share-whatsapp-${message.id}`}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-form border border-paper-edge bg-card px-3 text-body font-semibold text-seal transition-colors hover:border-seal hover:bg-pin-soft"
            >
              WhatsApp
            </a>
          </div>
          {showCopiedToast && (
            <p
              id={`share-toast-${message.id}`}
              role="status"
              className="mt-2 rounded-form bg-pin-soft px-3 py-2 text-center text-meta font-semibold text-seal"
            >
              Nakopya na!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  message,
  onRate,
}: {
  message: Extract<ChatMessage, { type: "feedback" }>;
  onRate: NuraChatActions["rateFeedback"];
}): JSX.Element {
  if (message.rating) {
    return (
      <div className="message-enter w-full max-w-[30rem] rounded-form border border-paper-edge bg-card px-4 py-3 text-body font-semibold text-ink">
        {message.rating === "positive"
          ? "Salamat sa feedback! 💚"
          : "Salamat. Ipa-improve namin ang Nura."}
      </div>
    );
  }

  return (
    <div className="message-enter w-full max-w-[30rem] rounded-form border border-paper-edge bg-card px-4 py-3">
      <p className="text-body font-semibold text-ink">
        Nakatulong ba ang rekomendasyon na ito?
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          id={`feedback-positive-${message.id}`}
          type="button"
          onClick={() => onRate(message.id, "positive")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-form bg-seal px-4 text-body font-semibold text-card transition-colors hover:bg-seal-press"
        >
          👍 Oo, nakatulong
        </button>
        <button
          id={`feedback-negative-${message.id}`}
          type="button"
          onClick={() => onRate(message.id, "negative")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-form border border-paper-edge bg-card px-4 text-body font-semibold text-ink-soft transition-colors hover:border-seal hover:text-seal"
        >
          👎 Hindi masyadong
        </button>
      </div>
    </div>
  );
}

export function ChatMessageItem({
  message,
  state,
  actions,
}: ChatMessageItemProps): JSX.Element | null {
  if (message.type === "bot-text") {
    return (
      <BotBubble>
        <p className="whitespace-pre-line">{message.content}</p>
      </BotBubble>
    );
  }

  if (message.type === "bot-question") {
    const latestQuestionId = latestMessageIdOfType(state.messages, "bot-question");
    const isActionable =
      message.id === latestQuestionId &&
      !state.isLoading &&
      (state.step === "asking_concern" ||
        state.step === "asking_location" ||
        state.step === "follow_up");

    return (
      <BotBubble>
        <p className="whitespace-pre-line">{message.content}</p>
        {isActionable && message.chips && (
          <QuickReplies
            options={message.chips}
            onSelect={actions.chooseQuickReply}
          />
        )}
      </BotBubble>
    );
  }

  if (message.type === "user-text") {
    return (
      <UserBubble>
        <p>{message.content}</p>
      </UserBubble>
    );
  }

  if (message.type === "benefit-picker") {
    const latestPickerId = latestMessageIdOfType(state.messages, "benefit-picker");
    const isActionable =
      message.id === latestPickerId &&
      !state.isLoading &&
      state.step === "asking_benefits";

    if (!isActionable) return null;

    return (
      <BenefitPickerCard
        benefits={state.benefits}
        onToggle={actions.toggleBenefit}
        onSubmit={() => {
          void actions.submitBenefits();
        }}
        isLoading={state.isLoading}
      />
    );
  }

  if (message.type === "typing") {
    return <TypingIndicator content={message.content} />;
  }

  if (message.type === "results") {
    return <ResultsBlock message={message} />;
  }

  if (message.type === "care-pass") {
    return (
      <CarePassCard
        pass={message.pass}
        onClose={actions.closeCarePass}
        onClear={actions.clearSavedCarePass}
      />
    );
  }

  if (message.type === "feedback") {
    return <FeedbackCard message={message} onRate={actions.rateFeedback} />;
  }

  return null;
}
