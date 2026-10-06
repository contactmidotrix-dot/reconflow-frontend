import type { Severity } from "../../types/results";

const SEVERITY_STYLES: Record<Severity, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "bg-severity-critical/10 text-severity-critical" },
  HIGH: { label: "High", className: "bg-severity-high/10 text-severity-high" },
  MEDIUM: { label: "Medium", className: "bg-severity-medium/10 text-severity-medium" },
  LOW: { label: "Low", className: "bg-severity-low/10 text-severity-low" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = SEVERITY_STYLES[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
