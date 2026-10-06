import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAnalysisStatus, fetchAnalysisSummary, fetchAnalysisDiscrepancies } from "../lib/results";
import { useReconciliationProgress } from "../lib/useReconciliationProgress";
import { ApiError } from "../lib/api";
import { ProgressTracker } from "../components/results/ProgressTracker";
import { ReportHero } from "../components/results/ReportHero";
import { AIExecutiveSummary } from "../components/results/AIExecutiveSummary";
import { RevenueBreakdownTable } from "../components/results/RevenueBreakdownTable";
import { HighPriorityCases } from "../components/results/HighPriorityCases";
import { DownloadDisputeReportButton } from "../components/results/DownloadDisputeReportButton";
import type { AnalysisStatus, AnalysisSummaryResponse, DiscrepancyDetailResponse } from "../types/results";

const POLL_INTERVAL_MS = 2000;

interface Period {
  periodStart: string;
  periodEnd: string;
}

type PageState =
  | { kind: "polling"; status: AnalysisStatus }
  | {
      kind: "completed";
      summary: AnalysisSummaryResponse;
      discrepancies: DiscrepancyDetailResponse[];
      period: Period;
    }
  | { kind: "failed"; reason: string | null }
  | { kind: "error"; message: string };

export function ResultsPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [state, setState] = useState<PageState>({ kind: "polling", status: "AWAITING_FILES" });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, [analysisId]);

  useEffect(() => {
    if (!analysisId) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function loadCompletedReport(period: Period) {
      try {
        const [summary, discrepancies] = await Promise.all([
          fetchAnalysisSummary(analysisId!),
          fetchAnalysisDiscrepancies(analysisId!),
        ]);
        if (!cancelledRef.current) {
          setState({ kind: "completed", summary, discrepancies, period });
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setState({
            kind: "error",
            message: err instanceof ApiError ? err.message : "Couldn't load the finished report.",
          });
        }
      }
    }

    async function poll() {
      try {
        const status = await fetchAnalysisStatus(analysisId!);
        if (cancelledRef.current) return;

        if (status.status === "COMPLETED") {
          if (intervalId) clearInterval(intervalId);
          await loadCompletedReport({ periodStart: status.period_start, periodEnd: status.period_end });
        } else if (status.status === "FAILED") {
          if (intervalId) clearInterval(intervalId);
          setState({ kind: "failed", reason: status.failure_reason });
        } else {
          setState({ kind: "polling", status: status.status });
        }
      } catch (err) {
        if (!cancelledRef.current) {
          if (intervalId) clearInterval(intervalId);
          setState({
            kind: "error",
            message: err instanceof ApiError ? err.message : "Couldn't check on this analysis.",
          });
        }
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [analysisId]);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {state.kind === "polling" && <PollingView status={state.status} />}
        {state.kind === "failed" && <FailedView reason={state.reason} />}
        {state.kind === "error" && <ErrorView message={state.message} />}
        {state.kind === "completed" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-paper-raised p-8">
              <ReportHero summary={state.summary} />
            </div>
            <div className="flex justify-center">
              <DownloadDisputeReportButton
                summary={state.summary}
                discrepancies={state.discrepancies}
                periodStart={state.period.periodStart}
                periodEnd={state.period.periodEnd}
              />
            </div>
            <AIExecutiveSummary summary={state.summary} />
            <RevenueBreakdownTable summary={state.summary} />
            <HighPriorityCases discrepancies={state.discrepancies} currency={state.summary.currency} />
          </div>
        )}
      </div>
    </div>
  );
}

function PollingView({ status }: { status: AnalysisStatus }) {
  const currentStepId = useReconciliationProgress(status);
  return (
    <div className="flex flex-col items-center py-16">
      <h1 className="font-display text-2xl text-ink">Running your reconciliation</h1>
      <p className="mt-1 text-sm text-ink-muted">This page will update on its own — no need to refresh.</p>
      <div className="mt-10">
        <ProgressTracker currentStepId={currentStepId} />
      </div>
    </div>
  );
}

function FailedView({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-8 text-center">
      <h1 className="font-display text-2xl text-ink">This run didn't complete</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
        {reason ?? "The pipeline stopped before finishing, and no reason was recorded."}
      </p>
      <a
        href="/upload"
        className="mt-6 inline-block rounded-lg bg-copper px-4 py-2.5 text-sm font-medium text-paper-raised hover:bg-copper-dark"
      >
        Try again
      </a>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-8 text-center">
      <h1 className="font-display text-2xl text-ink">Couldn't load this page</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">{message}</p>
    </div>
  );
}
