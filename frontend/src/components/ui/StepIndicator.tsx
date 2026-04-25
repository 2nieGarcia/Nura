import { STEP_LABELS } from "../../constants/app";

type StepIndicatorProps = {
  /** 0-indexed current step */
  currentStep: number;
};

export function StepIndicator({ currentStep }: StepIndicatorProps): JSX.Element {
  return (
    <nav className="flex items-center gap-2" aria-label="Progress">
      {STEP_LABELS.map((label, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-nura-primary text-white scale-110"
                    : isDone
                      ? "bg-nura-primary/20 text-nura-primary"
                      : "bg-nura-border text-nura-muted"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium ${
                  isActive ? "text-nura-primary" : "text-nura-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-[2px] w-6 rounded-full transition-colors duration-300 mb-4 ${
                  isDone ? "bg-nura-primary/30" : "bg-nura-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
