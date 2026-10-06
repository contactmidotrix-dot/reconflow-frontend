import { useState } from "react";
import { generateDisputeReport } from "../../lib/generateDisputeReport";
import type { AnalysisSummaryResponse, DiscrepancyDetailResponse } from "../../types/results";

export function DownloadDisputeReportButton({
  summary,
  discrepancies,
  periodStart,
  periodEnd,
}: {
  summary: AnalysisSummaryResponse;
  discrepancies: DiscrepancyDetailResponse[];
  periodStart: string;
  periodEnd: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);

  if (discrepancies.length === 0) {
    // Nothing to dispute - a claim document with zero claims doesn't
    // make sense to offer.
    return null;
  }

  async function handleClick() {
    setIsGenerating(true);
    setError(false);
    try {
      await generateDisputeReport(summary, discrepancies, { periodStart, periodEnd });
    } catch {
      // Realistic failure mode here is the dynamic import itself (jsPDF
      // loads on click, not up front - see generateDisputeReport.ts),
      // which fails if offline right at that moment. Everything else
      // this function does is synchronous PDF drawing from data already
      // in memory.
      setError(true);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 rounded-lg border border-copper/30 bg-copper-soft px-4 py-2.5 text-sm font-medium text-copper-dark transition-colors hover:bg-copper-soft/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
          <path
            d="M8 2v8m0 0L5 7m3 3l3-3M3 12v1.5A1.5 1.5 0 004.5 15h7a1.5 1.5 0 001.5-1.5V12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isGenerating ? "Preparing report…" : "Download dispute report"}
      </button>
      {error && (
        <p className="text-xs text-severity-critical">Couldn't generate the report — check your connection and try again.</p>
      )}
    </div>
  );
}
