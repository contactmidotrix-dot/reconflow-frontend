import type { AnalysisSummaryResponse } from "../../types/results";

export function AIExecutiveSummary({ summary }: { summary: AnalysisSummaryResponse }) {
  if (!summary.ai_executive_summary) {
    return null;
  }

  const isFake = summary.ai_provider_name === "fake";

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-8">
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="font-display text-lg text-ink">Executive summary</h2>
        {isFake && (
          <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-medium text-ink-muted">
            Demo mode — templated summary
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
        {summary.ai_executive_summary}
      </p>
    </section>
  );
}
