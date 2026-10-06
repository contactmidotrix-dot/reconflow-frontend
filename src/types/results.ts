export type AnalysisStatus = "DRAFT" | "AWAITING_FILES" | "PROCESSING" | "COMPLETED" | "FAILED";

export type DiscrepancyCategory =
  | "MISSING_SETTLEMENT"
  | "UNEXPECTED_SETTLEMENT"
  | "INCORRECT_COMMISSION"
  | "SETTLEMENT_AMOUNT_MISMATCH"
  | "CANCELLED_AFTER_PREPARATION";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** GET /analyses/{id} - polled while the pipeline runs. */
export interface AnalysisStatusResponse {
  id: string;
  branch_id: string;
  status: AnalysisStatus;
  period_start: string;
  period_end: string;
  failure_reason: string | null;
}

/** GET /analyses/{id}/summary */
export interface DiscrepancyBreakdownItem {
  category: DiscrepancyCategory;
  count: number;
  total_amount: string;
}

export interface AnalysisSummaryResponse {
  analysis_id: string;
  status: AnalysisStatus;
  currency: string;
  has_mixed_currencies: boolean;
  restaurant_name: string | null;
  contact_email: string | null;
  whatsapp_number: string | null;
  orders_processed: number;
  matched_count: number;
  unmatched_pos_count: number;
  unmatched_platform_count: number;
  total_potential_revenue_leakage: string;
  discrepancy_breakdown: DiscrepancyBreakdownItem[];
  ai_executive_summary: string | null;
  ai_provider_name: string | null;
}

/** GET /analyses/{id}/discrepancies */
export interface DiscrepancyDetailResponse {
  id: string;
  category: DiscrepancyCategory;
  severity: Severity;
  estimated_loss: string;
  order_reference: string | null;
  created_at: string;
}
