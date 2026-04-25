import { useCallback, useEffect, useRef, useState } from "react";
import {
  BENEFIT_OPTIONS,
  CONCERN_CHIPS,
  DEFAULT_BENEFITS,
  LOCATION_CHIPS,
} from "../constants/app";
import type { BenefitProfile } from "../types/benefits";
import type { Facility } from "../types/facility";
import { createSession, ensureSessionId, submitChatTurn } from "./api";
import type { ChatResponse } from "../types/chat";
import { cacheResults } from "./storage";

export type ChatStep =
  | "asking_concern"
  | "asking_location"
  | "asking_benefits"
  | "loading"
  | "results"
  | "follow_up";

export type ChatMessage =
  | {
      id: string;
      type: "bot-text";
      content: string;
      timestamp: number;
    }
  | {
      id: string;
      type: "bot-question";
      content: string;
      chips?: readonly string[];
      timestamp: number;
    }
  | {
      id: string;
      type: "user-text";
      content: string;
      timestamp: number;
    }
  | {
      id: string;
      type: "benefit-picker";
      timestamp: number;
    }
  | {
      id: string;
      type: "typing";
      content?: string;
      timestamp: number;
    }
  | {
      id: string;
      type: "results";
      concern: string;
      location: string;
      facilities: Facility[];
      reply: string;
      error: string | null;
      timestamp: number;
    };

export type NuraChatState = {
  step: ChatStep;
  messages: ChatMessage[];
  currentInput: string;
  concern: string;
  location: string;
  benefits: BenefitProfile;
  facilities: Facility[];
  reply: string;
  error: string | null;
  isLoading: boolean;
  isEmergency: boolean;
};

export type NuraChatActions = {
  setInput: (value: string) => void;
  sendInput: () => void;
  chooseQuickReply: (value: string) => void;
  toggleBenefit: (key: keyof BenefitProfile) => void;
  submitBenefits: () => Promise<void>;
  dismissEmergency: () => void;
  reset: () => void;
};

const LOCATION_USE_CURRENT = "Gamitin location ko";
const LOCATION_QUICK_REPLIES: readonly string[] = [
  ...LOCATION_CHIPS,
  LOCATION_USE_CURRENT,
];
const FOLLOW_UP_CHIPS: readonly string[] = [
  "Mag-search ulit",
  "Ibang location",
  "Ibang concern",
];

let idCounter = 0;

function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function now(): number {
  return Date.now();
}

function botText(content: string): ChatMessage {
  return {
    id: createId("bot-text"),
    type: "bot-text",
    content,
    timestamp: now(),
  };
}

function botQuestion(content: string, chips: readonly string[]): ChatMessage {
  return {
    id: createId("bot-question"),
    type: "bot-question",
    content,
    chips,
    timestamp: now(),
  };
}

function userText(content: string): ChatMessage {
  return {
    id: createId("user-text"),
    type: "user-text",
    content,
    timestamp: now(),
  };
}

function benefitPicker(): ChatMessage {
  return {
    id: createId("benefit-picker"),
    type: "benefit-picker",
    timestamp: now(),
  };
}

function typing(content?: string): ChatMessage {
  return {
    id: createId("typing"),
    type: "typing",
    content,
    timestamp: now(),
  };
}

function resultsMessage(params: {
  concern: string;
  location: string;
  facilities: Facility[];
  reply: string;
  error: string | null;
}): ChatMessage {
  return {
    id: createId("results"),
    type: "results",
    concern: params.concern,
    location: params.location,
    facilities: params.facilities,
    reply: params.reply,
    error: params.error,
    timestamp: now(),
  };
}

function createInitialState(): NuraChatState {
  return {
    step: "asking_concern",
    messages: [
      botText(
        "Kumusta! Ako si Nura. Hindi ako doktor, pero tutulungan kitang malaman kung saan ka pwedeng magpatingin, anong benefit ang pwede mong gamitin, at ano ang sasabihin mo sa front desk."
      ),
    ],
    currentInput: "",
    concern: "",
    location: "",
    benefits: { ...DEFAULT_BENEFITS },
    facilities: [],
    reply: "",
    error: null,
    isLoading: false,
    isEmergency: false,
  };
}

function hasBenefitSelection(benefits: BenefitProfile): boolean {
  return Object.values(benefits).some(Boolean);
}

function summarizeBenefits(benefits: BenefitProfile): string {
  if (benefits.noBenefits) return "Wala / hindi sure";

  const selected = BENEFIT_OPTIONS.filter(
    (option) => option.key !== "noBenefits" && benefits[option.key]
  ).map((option) => option.label);

  return selected.length > 0 ? selected.join(", ") : "Wala / hindi sure";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function hasMissingField(response: ChatResponse, field: "location_city" | "benefits"): boolean {
  return response.missing_fields?.includes(field) ?? false;
}

function toBenefitProfile(labels?: string[] | null): BenefitProfile {
  const profile: BenefitProfile = { ...DEFAULT_BENEFITS };
  if (!labels || labels.length === 0) return profile;

  for (const label of labels) {
    const normalized = label.trim().toLowerCase();
    if (normalized === "philhealth") profile.hasPhilHealth = true;
    if (normalized === "yakap") profile.hasYakap = true;
    if (normalized === "senior citizen") profile.isSenior = true;
    if (normalized === "pwd") profile.isPwd = true;
    if (normalized === "4ps") profile.is4ps = true;
    if (
      normalized === "philcare hmo" ||
      normalized === "hmo" ||
      normalized === "private insurance"
    ) {
      profile.hasPhilcare = true;
    }
    if (normalized === "no declared benefits") profile.noBenefits = true;
  }

  if (profile.noBenefits) {
    return { ...DEFAULT_BENEFITS, noBenefits: true };
  }

  return profile;
}

export function useNuraChat(): [NuraChatState, NuraChatActions] {
  const [state, setState] = useState<NuraChatState>(() => createInitialState());
  const stateRef = useRef(state);
  const apiSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let isCancelled = false;

    void ensureSessionId()
      .then((sessionId) => {
        if (!isCancelled) {
          apiSessionIdRef.current = sessionId;
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            error: "Hindi makakonekta sa Nura backend ngayon.",
          }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    // Staggered second and third initial messages
    const timer1 = setTimeout(() => {
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          botText("Walang account. Walang sine-save."),
        ],
      }));
    }, 500);

    const timer2 = setTimeout(() => {
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          botQuestion("Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
        ],
      }));
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const setInput = useCallback((value: string) => {
    setState((current) => ({ ...current, currentInput: value }));
  }, []);

  const submitConcernValue = useCallback(async (value: string) => {
    const concern = value.trim();
    if (!concern) return;

    const typingMessage = typing("Sine-check ko muna ang details mo sa backend...");
    const typingId = typingMessage.id;

    setState((current) => ({
      ...current,
      step: "loading",
      currentInput: "",
      concern,
      location: "",
      benefits: { ...DEFAULT_BENEFITS },
      facilities: [],
      reply: "",
      error: null,
      isLoading: true,
      isEmergency: false,
      messages: [...current.messages, userText(concern), typingMessage],
    }));

    try {
      // New concern starts a fresh backend session to avoid stale context.
      const freshSession = await createSession("fil-PH");
      apiSessionIdRef.current = freshSession.session_id;

      const response = await submitChatTurn(freshSession.session_id, {
        message: concern,
        intent: "HOSPITAL",
      });

      apiSessionIdRef.current = response.session_id;

      if (response.response_type === "EMERGENCY" || response.is_emergency) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isEmergency: true,
          messages: current.messages.filter((message) => message.id !== typingId),
        }));
        return;
      }

      const needsLocation = hasMissingField(response, "location_city");
      const needsBenefits = hasMissingField(response, "benefits");
      const inferredLocation = response.session?.location_city?.trim() ?? "";

      if (response.response_type === "FOLLOW_UP" && (needsLocation || needsBenefits)) {
        setState((current) => ({
          ...current,
          step: needsLocation ? "asking_location" : "asking_benefits",
          location: inferredLocation || current.location,
          benefits: needsBenefits
            ? toBenefitProfile(response.session?.benefits)
            : current.benefits,
          isLoading: false,
          error: null,
          messages: [
            ...current.messages.filter((message) => message.id !== typingId),
            needsLocation
              ? botQuestion(response.reply, LOCATION_QUICK_REPLIES)
              : botText(response.reply),
            ...(needsBenefits && !needsLocation ? [benefitPicker()] : []),
          ],
        }));
        return;
      }

      const resolvedLocation = inferredLocation || "lugar mo";
      cacheResults(response.facilities, response.reply);

      setState((current) => ({
        ...current,
        step: "follow_up",
        location: inferredLocation || current.location,
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern,
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            error: null,
          }),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      setState((current) => ({
        ...current,
        step: "asking_concern",
        isLoading: false,
        error: "May problema sa connection. Subukan ulit mamaya.",
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText("May problema sa connection. Subukan ulit mamaya."),
          botQuestion("Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
        ],
      }));
    }
  }, []);

  const askForTypedLocation = useCallback(() => {
    setState((current) => ({
      ...current,
      step: "asking_location",
      currentInput: "",
      messages: [
        ...current.messages,
        userText(LOCATION_USE_CURRENT),
        botQuestion(
          "Hindi ko pa ma-access ang live location dito. I-type ang city o barangay, o pumili sa listahan.",
          LOCATION_CHIPS
        ),
      ],
    }));
  }, []);

  const submitLocationValue = useCallback(async (value: string) => {
    const location = value.trim();
    if (!location) return;

    const typingMessage = typing(`Ino-update ang location mo: ${location}...`);
    const typingId = typingMessage.id;

    setState((current) => ({
      ...current,
      step: "loading",
      currentInput: "",
      location,
      isLoading: true,
      error: null,
      messages: [...current.messages, userText(location), typingMessage],
    }));

    try {
      const response = await submitChatTurn(apiSessionIdRef.current, {
        message: location,
        location,
        intent: "HOSPITAL",
      });

      apiSessionIdRef.current = response.session_id;

      if (response.response_type === "EMERGENCY" || response.is_emergency) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isEmergency: true,
          messages: current.messages.filter((message) => message.id !== typingId),
        }));
        return;
      }

      const needsLocation = hasMissingField(response, "location_city");
      const needsBenefits = hasMissingField(response, "benefits");
      const resolvedLocation = response.session?.location_city?.trim() || location;

      if (response.response_type === "FOLLOW_UP" && needsLocation) {
        setState((current) => ({
          ...current,
          step: "asking_location",
          location: resolvedLocation,
          isLoading: false,
          messages: [
            ...current.messages.filter((message) => message.id !== typingId),
            botQuestion(response.reply, LOCATION_QUICK_REPLIES),
          ],
        }));
        return;
      }

      if (response.response_type === "FOLLOW_UP" && needsBenefits) {
        setState((current) => ({
          ...current,
          step: "asking_benefits",
          location: resolvedLocation,
          benefits: toBenefitProfile(response.session?.benefits),
          isLoading: false,
          messages: [
            ...current.messages.filter((message) => message.id !== typingId),
            botText(response.reply),
            benefitPicker(),
          ],
        }));
        return;
      }

      cacheResults(response.facilities, response.reply);
      setState((current) => ({
        ...current,
        step: "follow_up",
        location: resolvedLocation,
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern: current.concern || "iyong concern",
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            error: null,
          }),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      setState((current) => ({
        ...current,
        step: "asking_location",
        isLoading: false,
        error: "May problema sa connection. Subukan ulit mamaya.",
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText("May problema sa connection. Subukan ulit mamaya."),
          botQuestion(
            "Pakitype ulit ang city o barangay mo para matuloy ang rekomendasyon.",
            LOCATION_QUICK_REPLIES
          ),
        ],
      }));
    }
  }, []);

  const sendInput = useCallback(() => {
    const snapshot = stateRef.current;
    const value = snapshot.currentInput.trim();

    if (!value || snapshot.isLoading || snapshot.step === "asking_benefits") {
      return;
    }

    if (snapshot.step === "asking_concern") {
      void submitConcernValue(value);
      return;
    }

    if (snapshot.step === "asking_location") {
      void submitLocationValue(value);
      return;
    }

    if (snapshot.step === "follow_up" || snapshot.step === "results") {
      void submitConcernValue(value);
    }
  }, [submitConcernValue, submitLocationValue]);

  const chooseQuickReply = useCallback(
    (value: string) => {
      const snapshot = stateRef.current;

      if (snapshot.isLoading) return;

      if (snapshot.step === "asking_concern") {
        submitConcernValue(value);
        return;
      }

      if (snapshot.step === "asking_location") {
        if (value === LOCATION_USE_CURRENT) {
          askForTypedLocation();
          return;
        }

        submitLocationValue(value);
        return;
      }

      if (snapshot.step === "follow_up") {
        if (value === "Ibang location") {
          setState((current) => ({
            ...current,
            step: current.concern ? "asking_location" : "asking_concern",
            currentInput: "",
            location: "",
            benefits: { ...DEFAULT_BENEFITS },
            facilities: [],
            reply: "",
            error: null,
            messages: [
              ...current.messages,
              userText(value),
              current.concern
                ? botQuestion(
                    "Sige. Saan ka ngayon? Para mahanap ko ang mas malapit na pasilidad.",
                    LOCATION_QUICK_REPLIES
                  )
                : botQuestion("Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
            ],
          }));
          return;
        }

        if (value === "Ibang concern" || value === "Mag-search ulit") {
          setState((current) => ({
            ...current,
            step: "asking_concern",
            currentInput: "",
            concern: "",
            location: "",
            benefits: { ...DEFAULT_BENEFITS },
            facilities: [],
            reply: "",
            error: null,
            messages: [
              ...current.messages,
              userText(value),
              botQuestion("Sige. Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
            ],
          }));
        }
      }
    },
    [askForTypedLocation, submitConcernValue, submitLocationValue]
  );

  const toggleBenefit = useCallback((key: keyof BenefitProfile) => {
    setState((current) => {
      if (current.step !== "asking_benefits" || current.isLoading) return current;

      if (key === "noBenefits") {
        return {
          ...current,
          benefits: {
            ...DEFAULT_BENEFITS,
            noBenefits: !current.benefits.noBenefits,
          },
        };
      }

      return {
        ...current,
        benefits: {
          ...current.benefits,
          [key]: !current.benefits[key],
          noBenefits: false,
        },
      };
    });
  }, []);

  const submitBenefits = useCallback(async () => {
    const snapshot = stateRef.current;

    if (
      snapshot.isLoading ||
      snapshot.step !== "asking_benefits" ||
      !hasBenefitSelection(snapshot.benefits)
    ) {
      return;
    }

    const selectedBenefits = { ...snapshot.benefits };
    const concern = snapshot.concern;
    const location = snapshot.location;
    const benefitSummary = summarizeBenefits(selectedBenefits);
    const typingMessage = typing(
      `Hinahanap ang mga pasilidad para sa ${concern} sa ${location}...`
    );
    const typingId = typingMessage.id;

    setState((current) => ({
      ...current,
      step: "loading",
      currentInput: "",
      isLoading: true,
      error: null,
      messages: [...current.messages, userText(benefitSummary), typingMessage],
    }));

    try {
      const response = await submitChatTurn(apiSessionIdRef.current, {
        message: concern,
        location,
        benefits: selectedBenefits,
        intent: "HOSPITAL",
      });

      apiSessionIdRef.current = response.session_id;

      if (response.response_type === "EMERGENCY" || response.is_emergency) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isEmergency: true,
          messages: current.messages.filter((message) => message.id !== typingId),
        }));
        return;
      }

      const needsLocation = hasMissingField(response, "location_city");
      const needsBenefits = hasMissingField(response, "benefits");

      if (response.response_type === "FOLLOW_UP" && (needsLocation || needsBenefits)) {
        setState((current) => ({
          ...current,
          step: needsLocation ? "asking_location" : "asking_benefits",
          location: response.session?.location_city?.trim() || current.location,
          benefits: toBenefitProfile(response.session?.benefits),
          error: null,
          isLoading: false,
          messages: [
            ...current.messages.filter((message) => message.id !== typingId),
            needsLocation
              ? botQuestion(response.reply, LOCATION_QUICK_REPLIES)
              : botText(response.reply),
            ...(needsBenefits && !needsLocation ? [benefitPicker()] : []),
          ],
        }));
        return;
      }

      cacheResults(response.facilities, response.reply);

      setState((current) => ({
        ...current,
        step: "follow_up",
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        isEmergency: false,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern,
            location: response.session?.location_city?.trim() || location,
            facilities: response.facilities,
            reply: response.reply,
            error: null,
          }),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      const error = "May problema sa connection. Subukan ulit mamaya.";

      setState((current) => ({
        ...current,
        step: "asking_benefits",
        facilities: [],
        reply: "",
        error,
        isLoading: false,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(error),
          benefitPicker(),
        ],
      }));
    }
  }, []);

  const dismissEmergency = useCallback(() => {
    setState((current) => ({
      ...current,
      step: "asking_concern",
      currentInput: "",
      concern: "",
      isEmergency: false,
      messages: [
        ...current.messages,
        botQuestion("Okay. Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
      ],
    }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
  }, []);

  const actions: NuraChatActions = {
    setInput,
    sendInput,
    chooseQuickReply,
    toggleBenefit,
    submitBenefits,
    dismissEmergency,
    reset,
  };

  return [state, actions];
}
