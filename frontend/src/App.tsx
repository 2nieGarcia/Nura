import { ChatInput } from "./components/chat/ChatInput";
import { ChatMessageItem } from "./components/chat/ChatMessageItem";
import { ChatThread } from "./components/chat/ChatThread";
import { AppShell } from "./components/layout/AppShell";
import { EmergencyScreen } from "./components/screens/EmergencyScreen";
import { OfflineBanner } from "./components/ui/OfflineBanner";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useNuraChat, type ChatStep } from "./lib/useNuraChat";

function getPlaceholderForStep(step: ChatStep): string {
  if (step === "asking_concern") return "Sabihin ang concern mo...";
  if (step === "asking_location") return "City o barangay...";
  return "Mag-tanong pa...";
}

export default function App(): JSX.Element {
  const isOnline = useOnlineStatus();
  const [state, actions] = useNuraChat();

  if (state.isEmergency) {
    return <EmergencyScreen onDismiss={actions.dismissEmergency} />;
  }

  return (
    <AppShell showHeader={true}>
      <OfflineBanner isOnline={isOnline} />

      <ChatThread messages={state.messages}>
        {state.messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            state={state}
            actions={actions}
          />
        ))}
      </ChatThread>

      <ChatInput
        value={state.currentInput}
        onChange={actions.setInput}
        onSend={actions.sendInput}
        disabled={state.isLoading || state.step === "asking_benefits"}
        placeholder={getPlaceholderForStep(state.step)}
      />
    </AppShell>
  );
}
