import { useCallback, useState } from "react";
import type { NuraScreen } from "../types/chat";
import type { BenefitProfile } from "../types/benefits";
import type { Facility } from "../types/facility";
import { DEFAULT_BENEFITS } from "../constants/app";
import { isEmergencyMessage } from "./emergency";
import { submitNavigation } from "./api";
import { useSessionId } from "../hooks/useSessionId";
import { cacheResults } from "./storage";

export type NuraState = {
  screen: NuraScreen;
  concern: string;
  location: string;
  benefits: BenefitProfile;
  facilities: Facility[];
  reply: string;
  error: string | null;
  isLoading: boolean;
};

const INITIAL_STATE: NuraState = {
  screen: "welcome",
  concern: "",
  location: "",
  benefits: { ...DEFAULT_BENEFITS },
  facilities: [],
  reply: "",
  error: null,
  isLoading: false,
};

export type NuraActions = {
  start: () => void;
  setConcern: (value: string) => void;
  submitConcern: () => void;
  setLocation: (value: string) => void;
  submitLocation: () => void;
  toggleBenefit: (key: keyof BenefitProfile) => void;
  submitBenefits: () => Promise<void>;
  reset: () => void;
  dismissEmergency: () => void;
};

export function useNura(): [NuraState, NuraActions] {
  const sessionId = useSessionId();
  const [state, setState] = useState<NuraState>(INITIAL_STATE);

  const start = useCallback(() => {
    setState((s) => ({ ...s, screen: "concern" }));
  }, []);

  const setConcern = useCallback((value: string) => {
    setState((s) => ({ ...s, concern: value }));
  }, []);

  const submitConcern = useCallback(() => {
    setState((s) => {
      const trimmed = s.concern.trim();
      if (!trimmed) return s;

      // Emergency intercept
      if (isEmergencyMessage(trimmed)) {
        return { ...s, concern: trimmed, screen: "emergency" };
      }

      return { ...s, concern: trimmed, screen: "location" };
    });
  }, []);

  const setLocation = useCallback((value: string) => {
    setState((s) => ({ ...s, location: value }));
  }, []);

  const submitLocation = useCallback(() => {
    setState((s) => {
      const trimmed = s.location.trim();
      if (!trimmed) return s;
      return { ...s, location: trimmed, screen: "benefits" };
    });
  }, []);

  const toggleBenefit = useCallback((key: keyof BenefitProfile) => {
    setState((s) => {
      if (key === "noBenefits") {
        const next: BenefitProfile = { ...DEFAULT_BENEFITS, noBenefits: !s.benefits.noBenefits };
        return { ...s, benefits: next };
      }

      const next: BenefitProfile = {
        ...s.benefits,
        [key]: !s.benefits[key],
        noBenefits: false,
      };
      return { ...s, benefits: next };
    });
  }, []);

  const submitBenefits = useCallback(async () => {
    setState((s) => ({ ...s, screen: "loading", isLoading: true, error: null }));

    try {
      const current = await new Promise<NuraState>((resolve) => {
        setState((s) => {
          resolve(s);
          return s;
        });
      });

      const response = await submitNavigation(
        sessionId,
        current.concern,
        current.location,
        current.benefits
      );

      // Cache for offline
      cacheResults(response.facilities, response.reply);

      setState((s) => ({
        ...s,
        screen: "results",
        facilities: response.facilities,
        reply: response.reply,
        isLoading: false,
      }));
    } catch {
      setState((s) => ({
        ...s,
        screen: "results",
        error: "May problema sa connection. Subukan ulit mamaya.",
        isLoading: false,
      }));
    }
  }, [sessionId]);

  const reset = useCallback(() => {
    setState({ ...INITIAL_STATE });
  }, []);

  const dismissEmergency = useCallback(() => {
    setState((s) => ({ ...s, screen: "concern", concern: "" }));
  }, []);

  const actions: NuraActions = {
    start,
    setConcern,
    submitConcern,
    setLocation,
    submitLocation,
    toggleBenefit,
    submitBenefits,
    reset,
    dismissEmergency,
  };

  return [state, actions];
}
