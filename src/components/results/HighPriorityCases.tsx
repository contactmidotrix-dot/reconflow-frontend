import { formatCurrency } from "../../lib/format";
import { SeverityBadge } from "./SeverityBadge";
import type { DiscrepancyDetailResponse, Severity } from "../../types/results";

const SEVERITY_ORDER: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const CATEGORY_LABELS: Record<string, string> = {
  MISSING_SETTLEMENT: "Missing settlement",
  UNEXPECTED_SETTLEMENT: "Unexpected settlement",
  INCORRECT_COMMISSION: "Incorrect commission",
  SETTLEMENT_AMOUNT_MISMATCH: "Settlement amount mismatch",
  CANCELLED_AFTER_PREPARATION: "Cancelled after preparation",
};

export function HighPriorityCases({
  discrepancies,
  currency,
}: {
  discrepancies: DiscrepancyDetailResponse[];
  currency: string;
}) {
  if (discrepancies.length === 0) {
    return null;
  }

  const topTen = [...discrepancies]
    .sort((a, b) => {
      const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (bySeverity !== 0) return bySeverity;
      return Number.parseFloat(b.estimated_loss) - Number.parseFloat(a.estimated_loss);
    })
    .slice(0, 10);

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-8">
      <h2 className="mb-5 font-display text-lg text-ink">High priority cases</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th className="pb-2.5 font-medium">Order</th>
            <th className="pb-2.5 font-medium">Category</th>
            <th className="pb-2.5 font-medium">Severity</th>
            <th className="pb-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {topTen.map((item) => (
            <tr key={item.id}>
              <td className="py-3 font-medium text-ink">{item.order_reference ?? "—"}</td>
              <td className="py-3 text-ink-muted">{CATEGORY_LABELS[item.category] ?? item.category}</td>
              <td className="py-3">
                <SeverityBadge severity={item.severity} />
              </td>
              <td className="py-3 text-right tabular-nums text-ink">
                {formatCurrency(item.estimated_loss, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
