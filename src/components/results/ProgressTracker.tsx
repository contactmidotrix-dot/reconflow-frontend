import { PROGRESS_STEPS } from "../../lib/useReconciliationProgress";

export function ProgressTracker({ currentStepId }: { currentStepId: string }) {
  const currentIndex = PROGRESS_STEPS.findIndex((step) => step.id === currentStepId);

  return (
    <div className="mx-auto w-full max-w-sm">
      <ol className="space-y-3">
        {PROGRESS_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  isDone
                    ? "bg-copper text-paper-raised"
                    : isCurrent
                      ? "border-2 border-copper"
                      : "border border-line"
                }`}
              >
                {isDone && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                    <path
                      d="M2 6l2.5 2.5L10 3"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isCurrent && <span className="h-2 w-2 animate-pulse rounded-full bg-copper" />}
              </span>
              <span className={`text-sm ${isCurrent ? "font-medium text-ink" : isDone ? "text-ink-muted" : "text-ink-muted/60"}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-center text-xs text-ink-muted">
        Usually under a minute once the backend's warm.
      </p>
    </div>
  );
}
