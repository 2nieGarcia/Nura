import { useEffect, useState } from "react";
import { ChatInput } from "./components/chat/ChatInput";
import { ChatMessageItem } from "./components/chat/ChatMessageItem";
import { ChatThread } from "./components/chat/ChatThread";
import { AppShell } from "./components/layout/AppShell";
import { EmergencyScreen } from "./components/screens/EmergencyScreen";
import { OfflineBanner } from "./components/ui/OfflineBanner";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import {
  applyTheme,
  getStoredTheme,
  saveStoredTheme,
  type ThemeMode,
} from "./lib/theme";
import { useNuraChat, type ChatStep } from "./lib/useNuraChat";

function getPlaceholderForStep(step: ChatStep): string {
  if (step === "asking_concern") return "Sabihin ang concern mo...";
  if (step === "asking_location") return "City o barangay...";
  return "Mag-tanong pa...";
}

export default function App(): JSX.Element {
  const isOnline = useOnlineStatus();
  const [state, actions] = useNuraChat();
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    saveStoredTheme(theme);
  }, [theme]);

  function toggleTheme(): void {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  if (state.isEmergency) {
    return <EmergencyScreen onDismiss={actions.dismissEmergency} />;
  }

  return (
    <AppShell
      showHeader={true}
      language={state.language}
      onLanguageChange={actions.setLanguage}
      hasCarePass={state.carePass !== null}
      onOpenCarePass={actions.openCarePass}
      onNewConversation={actions.reset}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
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
        language={state.language}
      />
    </AppShell>
  );
}
