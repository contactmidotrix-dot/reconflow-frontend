import { formatCurrency } from "../../lib/format";
import type { AnalysisSummaryResponse } from "../../types/results";

export function ReportHero({ summary }: { summary: AnalysisSummaryResponse }) {
  const leakageValue = Number.parseFloat(summary.total_potential_revenue_leakage);
  const isClean = leakageValue === 0;

  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-ink-muted">
        Total potential revenue leakage
      </p>
      <p
        className={`mt-2 font-display text-6xl font-medium tracking-tight ${
          isClean ? "text-severity-low" : "text-severity-critical"
        }`}
      >
        {formatCurrency(summary.total_potential_revenue_leakage, summary.currency)}
      </p>
      {summary.has_mixed_currencies && (
        <p className="mt-1.5 text-xs text-ink-muted">
          This period includes more than one currency — the total above sums raw amounts without
          converting between them, so treat it as directional rather than exact.
        </p>
      )}
      <p className="mt-2 text-sm text-ink-muted">
        {isClean
          ? "Every order reconciled cleanly for this period."
          : `Across ${summary.discrepancy_breakdown.reduce((sum, item) => sum + item.count, 0)} discrepancies this period.`}
      </p>

      <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
        <div>
          <dt className="text-xs text-ink-muted">Orders processed</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{summary.orders_processed}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Matched</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{summary.matched_count}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Unmatched</dt>
          <dd className="mt-1 font-display text-2xl text-ink">
            {summary.unmatched_pos_count + summary.unmatched_platform_count}
          </dd>
        </div>
      </dl>
    </div>
  );
}
