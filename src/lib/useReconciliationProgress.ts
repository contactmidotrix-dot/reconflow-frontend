import { useEffect, useRef, useState } from "react";
import type { AnalysisStatus } from "../types/results";

export interface ProgressStep {
  id: string;
  label: string;
}

export const PROGRESS_STEPS: ProgressStep[] = [
  { id: "waking", label: "Waking up the backend" },
  { id: "uploading", label: "Uploading files" },
  { id: "validating", label: "Validating files" },
  { id: "normalizing", label: "Normalizing data" },
  { id: "matching", label: "Matching orders" },
  { id: "comparing", label: "Comparing amounts" },
  { id: "discrepancies", label: "Detecting discrepancies" },
  { id: "ai-insights", label: "Generating AI insights" },
];

const WAKE_WINDOW_MS = 18_000;
const SUBSTAGE_MS = 5_000;

const AWAITING_FILES_STEP_IDS = ["uploading", "validating"];
const PROCESSING_STEP_IDS = ["normalizing", "matching", "comparing", "discrepancies", "ai-insights"];

/**
 * This is a time-based estimate, not a real read of pipeline state - the
 * frontend only ever knows AWAITING_FILES vs PROCESSING from polling, no
 * finer-grained signal exists to know which of n8n's ~15 steps is
 * actually running. A status change is real signal and resets the
 * within-status clock; elapsed time is only ever the fallback for
 * showing forward motion between those two known points, not a claim
 * about exact completion.
 */
export function useReconciliationProgress(status: AnalysisStatus | null): string {
  const [currentStepId, setCurrentStepId] = useState("waking");
  const mountedAtRef = useRef(Date.now());
  const statusChangedAtRef = useRef(Date.now());
  const lastStatusRef = useRef<AnalysisStatus | null>(status);

  useEffect(() => {
    // Co-located with tick() below on purpose: both need to run in this
    // order on every status change (record the change, then compute from
    // it), which is guaranteed within one effect and would only be
    // guaranteed across two separate effects by relying on their
    // declaration order - correct, but the kind of implicit correctness
    // that breaks quietly if someone reorders them later.
    if (status !== lastStatusRef.current) {
      statusChangedAtRef.current = Date.now();
      lastStatusRef.current = status;
    }

    const tick = () => {
      const sinceMount = Date.now() - mountedAtRef.current;
      if (sinceMount < WAKE_WINDOW_MS) {
        setCurrentStepId("waking");
        return;
      }

      const stepIds = status === "PROCESSING" ? PROCESSING_STEP_IDS : AWAITING_FILES_STEP_IDS;
      const sinceStatusChange = Date.now() - statusChangedAtRef.current;
      const index = Math.min(
        Math.floor(sinceStatusChange / SUBSTAGE_MS),
        stepIds.length - 1,
      );
      setCurrentStepId(stepIds[index]);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status]);

  return currentStepId;
}
