import { formatCurrency } from "../../lib/format";
import { RECOMMENDED_ACTIONS } from "../../lib/recommendedActions";
import type { AnalysisSummaryResponse } from "../../types/results";

const CATEGORY_LABELS: Record<string, string> = {
  MISSING_SETTLEMENT: "Missing settlement",
  UNEXPECTED_SETTLEMENT: "Unexpected settlement",
  INCORRECT_COMMISSION: "Incorrect commission",
  SETTLEMENT_AMOUNT_MISMATCH: "Settlement amount mismatch",
  CANCELLED_AFTER_PREPARATION: "Cancelled after preparation",
};

export function RevenueBreakdownTable({ summary }: { summary: AnalysisSummaryResponse }) {
  if (summary.discrepancy_breakdown.length === 0) {
    return null;
  }

  const sorted = [...summary.discrepancy_breakdown].sort(
    (a, b) => Number.parseFloat(b.total_amount) - Number.parseFloat(a.total_amount),
  );

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-8">
      <h2 className="mb-5 font-display text-lg text-ink">Revenue leakage breakdown</h2>
      <div className="divide-y divide-line">
        {sorted.map((item) => (
          <div key={item.category} className="py-5 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="font-medium text-ink">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </h3>
                <p className="text-sm text-ink-muted">
                  {item.count} {item.count === 1 ? "case" : "cases"}
                </p>
              </div>
              <p className="shrink-0 font-display text-xl tabular-nums text-copper-dark">
                {formatCurrency(item.total_amount, summary.currency)}
              </p>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              {RECOMMENDED_ACTIONS[item.category]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
