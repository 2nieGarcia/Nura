import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LanguageCode } from "../../types/language";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0?: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
};

type SpeechRecognitionResultEventLike = Event & {
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder: string;
  language: LanguageCode;
};

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getRecognitionLanguage(language: LanguageCode): string {
  const languageMap: Record<LanguageCode, string> = {
    auto: "fil-PH",
    fil: "fil-PH",
    en: "en-PH",
    ceb: "ceb",
    ilo: "ilo-PH",
    hil: "hil-PH",
  };

  return languageMap[language];
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  language,
}: ChatInputProps): JSX.Element {
  const canSend = value.trim().length > 0 && !disabled;
  const RecognitionConstructor = getSpeechRecognitionConstructor();
  const supportsVoice = RecognitionConstructor !== null;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceError, setShowVoiceError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSend) return;
    onSend();
  }

  function clearSilenceTimer(): void {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function showErrorToast(): void {
    setShowVoiceError(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setShowVoiceError(false);
    }, 2000);
  }

  function stopListening(): void {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function handleVoiceInput(): void {
    if (!RecognitionConstructor || disabled) return;

    if (isListening) {
      stopListening();
      return;
    }

    const recognition = new RecognitionConstructor();
    recognition.lang = getRecognitionLanguage(language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results.item(event.results.length - 1);
      const transcript = result[0]?.transcript?.trim() ?? "";
      if (transcript) {
        onChange(transcript);
      }
      stopListening();
    };
    recognition.onerror = () => {
      showErrorToast();
      stopListening();
    };
    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
      silenceTimerRef.current = window.setTimeout(() => {
        recognition.stop();
      }, 10000);
    } catch {
      showErrorToast();
      setIsListening(false);
    }
  }

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      recognitionRef.current?.abort();
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-shrink-0 border-t border-paper-edge bg-paper/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 backdrop-blur"
    >
      <div className="flex items-center gap-2 rounded-form border border-paper-edge bg-card p-1 shadow-sm">
        <input
          id="chat-input-field"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-11 min-w-0 flex-1 rounded-form border border-transparent bg-transparent px-3 text-body text-ink placeholder:text-ink-mute disabled:cursor-not-allowed disabled:text-ink-mute"
        />
        {supportsVoice && (
          <button
            id="voice-input-button"
            type="button"
            disabled={disabled}
            onClick={handleVoiceInput}
            aria-label="Magsalita"
            aria-pressed={isListening}
            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute ${
              isListening
                ? "animate-pulse bg-stamp text-card shadow-[0_0_0_4px_rgba(185,28,28,0.18)]"
                : "bg-seal text-card hover:bg-seal-press active:bg-seal-press"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
              <path d="M19 11a7 7 0 0 1-14 0" />
              <path d="M12 18v3" />
              <path d="M8 21h8" />
            </svg>
          </button>
        )}
        <button
          id="chat-send-button"
          type="submit"
          disabled={!canSend}
          aria-label="Ipadala"
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-seal text-card transition-colors hover:bg-seal-press active:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      {showVoiceError && (
        <p
          id="voice-input-toast"
          role="status"
          className="mt-2 rounded-form bg-stamp-bg px-3 py-2 text-center text-meta font-semibold text-stamp"
        >
          Hindi narinig. Subukan ulit.
        </p>
      )}
    </form>
  );
}
