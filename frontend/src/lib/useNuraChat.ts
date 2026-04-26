import { useCallback, useEffect, useRef, useState } from "react";
import {
  APP_COPY,
  BENEFIT_OPTIONS,
  CONCERN_CHIPS,
  DEFAULT_BENEFITS,
  LOCATION_CHIPS,
} from "../constants/app";
import type { BenefitProfile } from "../types/benefits";
import type { Facility } from "../types/facility";
import type { LanguageCode } from "../types/language";
import { createSession, ensureSessionId, submitChatTurn } from "./api";
import type { ChatResponse } from "../types/chat";
import { getFacilityCoordinates } from "./maps";
import {
  appendFeedbackLog,
  cacheResults,
  clearCarePass,
  clearConversation,
  getCarePass,
  getConversation,
  getStoredLanguage,
  saveConversation,
  saveCarePass,
  saveStoredLanguage,
  type CarePass,
  type FeedbackRating,
} from "./storage";

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
      benefitsSummary: string;
      error: string | null;
      timestamp: number;
    }
  | {
      id: string;
      type: "care-pass";
      pass: CarePass;
      timestamp: number;
    }
  | {
      id: string;
      type: "feedback";
      concern: string;
      location: string;
      rating: FeedbackRating | null;
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
  language: LanguageCode;
  carePass: CarePass | null;
  restoredFromStorage: boolean;
};

export type NuraChatActions = {
  setInput: (value: string) => void;
  setLanguage: (value: LanguageCode) => void;
  sendInput: () => void;
  chooseQuickReply: (value: string) => void;
  toggleBenefit: (key: keyof BenefitProfile) => void;
  submitBenefits: () => Promise<void>;
  openCarePass: () => void;
  closeCarePass: () => void;
  clearSavedCarePass: () => void;
  dismissEmergency: () => void;
  reset: () => void;
  rateFeedback: (messageId: string, rating: FeedbackRating) => void;
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
const FOLLOW_UP_FREE_TEXT_CHIPS: readonly string[] = [
  "Mag-search ulit",
  "Ibang concern",
];
const INTRO_COPY =
  "Kumusta! Ako si Nura. Hindi ako doktor, pero tutulungan kitang malaman kung saan ka pwedeng magpatingin, anong benefit ang pwede mong gamitin, at ano ang sasabihin mo sa front desk.";
const CONNECTION_ERROR_COPY =
  "Hindi makakonekta sa Nura ngayon. Kung urgent o lumalala ang sintomas, pumunta agad sa pinakamalapit na ER o tumawag sa local emergency hotline.";

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
  benefitsSummary: string;
  error: string | null;
}): ChatMessage {
  return {
    id: createId("results"),
    type: "results",
    concern: params.concern,
    location: params.location,
    facilities: params.facilities,
    reply: params.reply,
    benefitsSummary: params.benefitsSummary,
    error: params.error,
    timestamp: now(),
  };
}

function carePassMessage(pass: CarePass): ChatMessage {
  return {
    id: createId("care-pass"),
    type: "care-pass",
    pass,
    timestamp: now(),
  };
}

function feedbackMessage(concern: string, location: string): ChatMessage {
  return {
    id: createId("feedback"),
    type: "feedback",
    concern,
    location,
    rating: null,
    timestamp: now(),
  };
}

function connectionFallbackMessages(
  nextQuestion: ChatMessage,
  includeSavedPass = true
): ChatMessage[] {
  const pass = includeSavedPass ? getCarePass() : null;

  return [
    botText(CONNECTION_ERROR_COPY),
    ...(pass ? [carePassMessage(pass)] : []),
    nextQuestion,
  ];
}

function latestResultsMessage(
  messages: readonly ChatMessage[]
): Extract<ChatMessage, { type: "results" }> | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.type === "results") return message;
  }

  return null;
}

function createFreshInitialState(includeFullIntro: boolean): NuraChatState {
  return {
    step: "asking_concern",
    messages: includeFullIntro
      ? [
          botText(INTRO_COPY),
          botText(APP_COPY.privacyNote),
          botQuestion("Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS),
        ]
      : [botText(INTRO_COPY)],
    currentInput: "",
    concern: "",
    location: "",
    benefits: { ...DEFAULT_BENEFITS },
    facilities: [],
    reply: "",
    error: null,
    isLoading: false,
    isEmergency: false,
    language: getStoredLanguage(),
    carePass: getCarePass(),
    restoredFromStorage: false,
  };
}

function createInitialState(): NuraChatState {
  const saved = getConversation();
  if (!saved) return createFreshInitialState(false);

  const messages = saved.messages.filter((message) => message.type !== "typing");
  const latestResults = latestResultsMessage(messages);
  const restoredStep: ChatStep =
    saved.step === "loading"
      ? latestResults
        ? "follow_up"
        : "asking_concern"
      : saved.step;

  return {
    step: restoredStep,
    messages,
    currentInput: "",
    concern: saved.concern,
    location: saved.location,
    benefits: { ...DEFAULT_BENEFITS },
    facilities: latestResults?.facilities ?? [],
    reply: latestResults?.reply ?? "",
    error: latestResults?.error ?? null,
    isLoading: false,
    isEmergency: false,
    language: getStoredLanguage(),
    carePass: getCarePass(),
    restoredFromStorage: true,
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

function buildCarePass(params: {
  concern: string;
  location: string;
  benefits: BenefitProfile;
  facilities: Facility[];
  reply: string;
}): CarePass | null {
  const primary = params.facilities[0];
  if (!primary) return null;

  const coords = getFacilityCoordinates(primary);

  return {
    concern: params.concern,
    location: params.location,
    benefitsSummary: summarizeBenefits(params.benefits),
    facilityName: primary.name,
    facilityAddress: primary.address,
    whatToBring: primary.what_to_bring ?? null,
    whatToSay: primary.what_to_say ?? null,
    benefitToClaim: primary.benefit_to_claim ?? null,
    mapsUrl: primary.maps_url ?? null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    explanation: params.reply,
    savedAt: Date.now(),
    dataSource: primary.data_source,
  };
}

function saveLatestCarePass(params: {
  concern: string;
  location: string;
  benefits: BenefitProfile;
  facilities: Facility[];
  reply: string;
}): CarePass | null {
  const pass = buildCarePass(params);
  if (pass) {
    saveCarePass(pass);
  }

  return pass;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type NominatimReverseResponse = {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
  };
};

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
    });
  });
}

async function reverseGeocodeCity(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Nura healthcare access navigator",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  const city =
    data.address?.city ?? data.address?.town ?? data.address?.municipality ?? "";

  if (!city.trim()) {
    throw new Error("No city found.");
  }

  return city.trim();
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
    if (state.isLoading || state.step === "loading") return undefined;

    const timerId = window.setTimeout(() => {
      saveConversation(
        state.messages.filter((message) => message.type !== "typing"),
        state.step,
        state.concern,
        state.location
      );
    }, 500);

    return () => window.clearTimeout(timerId);
  }, [state.messages, state.step, state.concern, state.location, state.isLoading]);

  useEffect(() => {
    let isCancelled = false;

    void ensureSessionId(undefined, stateRef.current.language)
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
    if (stateRef.current.restoredFromStorage) return undefined;

    // Staggered second and third initial messages
    const timer1 = setTimeout(() => {
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          botText(APP_COPY.privacyNote),
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

  const setLanguage = useCallback((value: LanguageCode) => {
    saveStoredLanguage(value);
    setState((current) => ({ ...current, language: value }));
  }, []);

  const submitConcernValue = useCallback(async (value: string) => {
    const concern = value.trim();
    if (!concern) return;
    const language = stateRef.current.language;

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
      const freshSession = await createSession(language);
      apiSessionIdRef.current = freshSession.session_id;

      const response = await submitChatTurn(freshSession.session_id, {
        message: concern,
        language,
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
      const responseBenefits = toBenefitProfile(response.session?.benefits);
      const savedPass = saveLatestCarePass({
        concern,
        location: resolvedLocation,
        benefits: responseBenefits,
        facilities: response.facilities,
        reply: response.reply,
      });
      cacheResults(response.facilities, response.reply);

      setState((current) => ({
        ...current,
        step: "follow_up",
        location: inferredLocation || current.location,
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        carePass: savedPass ?? current.carePass,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern,
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            benefitsSummary: summarizeBenefits(responseBenefits),
            error: null,
          }),
          feedbackMessage(concern, resolvedLocation),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      setState((current) => ({
        ...current,
        step: "asking_concern",
        isLoading: false,
        carePass: getCarePass(),
        error: CONNECTION_ERROR_COPY,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          ...connectionFallbackMessages(
            botQuestion("Ano ang concern o sintomas mo ngayon?", CONCERN_CHIPS)
          ),
        ],
      }));
    }
  }, []);

  const submitLocationValue = useCallback(async (value: string) => {
    const location = value.trim();
    if (!location) return;
    const language = stateRef.current.language;

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
        concern: stateRef.current.concern,
        location,
        language,
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

      const responseBenefits = toBenefitProfile(response.session?.benefits);
      const savedPass = saveLatestCarePass({
        concern: stateRef.current.concern || "iyong concern",
        location: resolvedLocation,
        benefits: responseBenefits,
        facilities: response.facilities,
        reply: response.reply,
      });
      cacheResults(response.facilities, response.reply);
      setState((current) => ({
        ...current,
        step: "follow_up",
        location: resolvedLocation,
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        carePass: savedPass ?? current.carePass,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern: current.concern || "iyong concern",
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            benefitsSummary: summarizeBenefits(responseBenefits),
            error: null,
          }),
          feedbackMessage(current.concern || "iyong concern", resolvedLocation),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      setState((current) => ({
        ...current,
        step: "asking_location",
        isLoading: false,
        carePass: getCarePass(),
        error: CONNECTION_ERROR_COPY,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          ...connectionFallbackMessages(
            botQuestion(
              "Pakitype ulit ang city o barangay mo para matuloy ang rekomendasyon.",
              LOCATION_QUICK_REPLIES
            )
          ),
        ],
      }));
    }
  }, []);

  const askForTypedLocation = useCallback(async () => {
    const typingMessage = typing("Kinukuha ang location mo...");
    const typingId = typingMessage.id;

    setState((current) => ({
      ...current,
      step: "loading",
      currentInput: "",
      isLoading: true,
      error: null,
      messages: [...current.messages, userText(LOCATION_USE_CURRENT), typingMessage],
    }));

    try {
      const position = await getBrowserPosition();
      const city = await reverseGeocodeCity(
        position.coords.latitude,
        position.coords.longitude
      );

      setState((current) => ({
        ...current,
        isLoading: false,
        messages: current.messages.filter((message) => message.id !== typingId),
      }));

      await submitLocationValue(city);
    } catch {
      setState((current) => ({
        ...current,
        step: "asking_location",
        currentInput: "",
        isLoading: false,
        error: null,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText("Hindi ko nakuha ang location mo. I-type ang city o barangay mo."),
          botQuestion("Pumili sa listahan o i-type ang city o barangay mo.", LOCATION_CHIPS),
        ],
      }));
    }
  }, [submitLocationValue]);

  const submitFollowUpValue = useCallback(async (value: string) => {
    const followUp = value.trim();
    if (!followUp) return;
    const snapshot = stateRef.current;
    const language = snapshot.language;
    const typingMessage = typing("Tinitingnan ko ang sagot batay sa usapan natin...");
    const typingId = typingMessage.id;

    setState((current) => ({
      ...current,
      step: "loading",
      currentInput: "",
      isLoading: true,
      error: null,
      messages: [...current.messages, userText(followUp), typingMessage],
    }));

    try {
      const response = await submitChatTurn(apiSessionIdRef.current, {
        message: followUp,
        concern: snapshot.concern,
        language,
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

      const resolvedLocation =
        response.session?.location_city?.trim() || snapshot.location || "lugar mo";
      const responseBenefits = response.session?.benefits
        ? toBenefitProfile(response.session.benefits)
        : snapshot.benefits;
      const nextMessages: ChatMessage[] = [
        botText(response.reply),
      ];

      let savedPass: CarePass | null = null;
      if (response.facilities.length > 0) {
        savedPass = saveLatestCarePass({
          concern: snapshot.concern || followUp,
          location: resolvedLocation,
          benefits: responseBenefits,
          facilities: response.facilities,
          reply: response.reply,
        });
        cacheResults(response.facilities, response.reply);
        nextMessages.push(
          resultsMessage({
            concern: snapshot.concern || followUp,
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            benefitsSummary: summarizeBenefits(responseBenefits),
            error: null,
          }),
          feedbackMessage(snapshot.concern || followUp, resolvedLocation)
        );
      }

      nextMessages.push(
        botQuestion("Ano pa ang gusto mong gawin?", FOLLOW_UP_FREE_TEXT_CHIPS)
      );

      setState((current) => ({
        ...current,
        step: "follow_up",
        location: resolvedLocation,
        benefits: responseBenefits,
        facilities:
          response.facilities.length > 0 ? response.facilities : current.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        carePass: savedPass ?? current.carePass,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          ...nextMessages,
        ],
      }));
    } catch {
      setState((current) => ({
        ...current,
        step: "follow_up",
        isLoading: false,
        carePass: getCarePass(),
        error: CONNECTION_ERROR_COPY,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          ...connectionFallbackMessages(
            botQuestion("Ano pa ang gusto mong gawin?", FOLLOW_UP_FREE_TEXT_CHIPS)
          ),
        ],
      }));
    }
  }, []);

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
          void askForTypedLocation();
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
      if (FOLLOW_UP_CHIPS.includes(value)) {
        chooseQuickReply(value);
        return;
      }

      void submitFollowUpValue(value);
    }
  }, [chooseQuickReply, submitConcernValue, submitFollowUpValue, submitLocationValue]);

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
    const language = snapshot.language;
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
        concern,
        location,
        benefits: selectedBenefits,
        language,
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

      const resolvedLocation = response.session?.location_city?.trim() || location;
      const savedPass = saveLatestCarePass({
        concern,
        location: resolvedLocation,
        benefits: selectedBenefits,
        facilities: response.facilities,
        reply: response.reply,
      });
      cacheResults(response.facilities, response.reply);

      setState((current) => ({
        ...current,
        step: "follow_up",
        facilities: response.facilities,
        reply: response.reply,
        error: null,
        isLoading: false,
        isEmergency: false,
        carePass: savedPass ?? current.carePass,
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          botText(response.reply),
          resultsMessage({
            concern,
            location: resolvedLocation,
            facilities: response.facilities,
            reply: response.reply,
            benefitsSummary: summarizeBenefits(selectedBenefits),
            error: null,
          }),
          feedbackMessage(concern, resolvedLocation),
          botQuestion("Ano ang gusto mong gawin?", FOLLOW_UP_CHIPS),
        ],
      }));
    } catch {
      const error = CONNECTION_ERROR_COPY;

      setState((current) => ({
        ...current,
        step: "asking_benefits",
        facilities: [],
        reply: "",
        error,
        isLoading: false,
        carePass: getCarePass(),
        messages: [
          ...current.messages.filter((message) => message.id !== typingId),
          ...connectionFallbackMessages(botText("Piliin ulit ang benefit para masubukan natin muli.")),
          benefitPicker(),
        ],
      }));
    }
  }, []);

  const openCarePass = useCallback(() => {
    const pass = getCarePass();

    if (!pass) {
      setState((current) => ({
        ...current,
        carePass: null,
        messages: [
          ...current.messages.filter((message) => message.type !== "care-pass"),
          botText("Walang naka-save na Last Care Pass sa device na ito."),
        ],
      }));
      return;
    }

    setState((current) => ({
      ...current,
      carePass: pass,
      messages: [
        ...current.messages.filter((message) => message.type !== "care-pass"),
        carePassMessage(pass),
      ],
    }));
  }, []);

  const closeCarePass = useCallback(() => {
    setState((current) => ({
      ...current,
      messages: current.messages.filter((message) => message.type !== "care-pass"),
    }));
  }, []);

  const clearSavedCarePass = useCallback(() => {
    clearCarePass();
    setState((current) => ({
      ...current,
      carePass: null,
      messages: current.messages.filter((message) => message.type !== "care-pass"),
    }));
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
    clearConversation();
    setState(createFreshInitialState(true));
  }, []);

  const rateFeedback = useCallback(
    (messageId: string, rating: FeedbackRating) => {
      setState((current) => {
        const feedback = current.messages.find(
          (message): message is Extract<ChatMessage, { type: "feedback" }> =>
            message.type === "feedback" && message.id === messageId
        );

        if (!feedback || feedback.rating !== null) return current;

        appendFeedbackLog(rating, feedback.concern, feedback.location);

        return {
          ...current,
          messages: current.messages.map((message) =>
            message.type === "feedback" && message.id === messageId
              ? { ...message, rating }
              : message
          ),
        };
      });
    },
    []
  );

  const actions: NuraChatActions = {
    setInput,
    setLanguage,
    sendInput,
    chooseQuickReply,
    toggleBenefit,
    submitBenefits,
    openCarePass,
    closeCarePass,
    clearSavedCarePass,
    dismissEmergency,
    reset,
    rateFeedback,
  };

  return [state, actions];
}
