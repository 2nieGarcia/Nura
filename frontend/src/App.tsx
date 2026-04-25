import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useNura } from "./lib/useNura";
import { AppShell } from "./components/layout/AppShell";
import { OfflineBanner } from "./components/ui/OfflineBanner";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { ConcernScreen } from "./components/screens/ConcernScreen";
import { LocationScreen } from "./components/screens/LocationScreen";
import { BenefitScreen } from "./components/screens/BenefitScreen";
import { LoadingScreen } from "./components/screens/LoadingScreen";
import { ResultsScreen } from "./components/screens/ResultsScreen";
import { EmergencyScreen } from "./components/screens/EmergencyScreen";

export default function App(): JSX.Element {
  const isOnline = useOnlineStatus();
  const [state, actions] = useNura();

  // Emergency is full-screen, no shell
  if (state.screen === "emergency") {
    return <EmergencyScreen onDismiss={actions.dismissEmergency} />;
  }

  // Welcome keeps the letterhead header — first impression must establish trust.
  if (state.screen === "welcome") {
    return (
      <AppShell showHeader={true}>
        <OfflineBanner isOnline={isOnline} />
        <WelcomeScreen onStart={actions.start} />
      </AppShell>
    );
  }

  return (
    <AppShell showHeader={true}>
      <OfflineBanner isOnline={isOnline} />

      {state.screen === "concern" && (
        <ConcernScreen
          value={state.concern}
          onChange={actions.setConcern}
          onSubmit={actions.submitConcern}
        />
      )}

      {state.screen === "location" && (
        <LocationScreen
          value={state.location}
          onChange={actions.setLocation}
          onSubmit={actions.submitLocation}
        />
      )}

      {state.screen === "benefits" && (
        <BenefitScreen
          benefits={state.benefits}
          onToggle={actions.toggleBenefit}
          onSubmit={() => { void actions.submitBenefits(); }}
          isLoading={state.isLoading}
        />
      )}

      {state.screen === "loading" && <LoadingScreen />}

      {state.screen === "results" && (
        <ResultsScreen
          facilities={state.facilities}
          reply={state.reply}
          error={state.error}
          concern={state.concern}
          location={state.location}
          onReset={actions.reset}
        />
      )}
    </AppShell>
  );
}
