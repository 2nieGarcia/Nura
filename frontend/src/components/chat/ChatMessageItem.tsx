import { APP_COPY } from "../../constants/app";
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
  const [primary, ...alternates] = message.facilities;

  return (
    <div className="message-enter w-full space-y-4">
      {message.error ? (
        <div
          role="alert"
          className="border-l-rule border-mark bg-mark-bg px-4 py-3 text-body text-ink"
        >
          {message.error}
        </div>
      ) : primary ? (
        <PrimaryRecommendation facility={primary} concern={message.concern} />
      ) : (
        <p className="border-l-rule border-ink/30 bg-card px-4 py-4 text-body text-ink-soft">
          {APP_COPY.noResults}
        </p>
      )}

      {alternates.length > 0 && (
        <div className="rounded-block border border-paper-edge bg-card px-4 py-3">
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
        <p>{message.content}</p>
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
        <p>{message.content}</p>
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

  return null;
}
